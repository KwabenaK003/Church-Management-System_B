-- ============================================================================
-- Church Management System — Normalized Supabase Schema
-- Phase 1 foundation schema aligned to the implementation plan.
--
-- Notes:
-- - This script is intended for a fresh setup or controlled reset.
-- - Authenticated users receive full access to admin tables through RLS.
-- - Anonymous users may read services and members, and insert attendance,
--   to support the public service check-in flow.
-- ============================================================================

create extension if not exists "pgcrypto";
create extension if not exists "citext";

-- ----------------------------------------------------------------------------
-- Reset existing objects in dependency order.
-- ----------------------------------------------------------------------------

drop trigger if exists on_auth_user_created on auth.users;
drop function if exists public.handle_new_user();
drop function if exists public.touch_updated_at();

drop table if exists notification_logs cascade;
drop table if exists notification_schedules cascade;
drop table if exists sms_campaign_recipients cascade;
drop table if exists sms_campaigns cascade;
drop table if exists sms_templates cascade;
drop table if exists follow_up_tasks cascade;
drop table if exists expense_attachments cascade;
drop table if exists expenses cascade;
drop table if exists budgets cascade;
drop table if exists expense_categories cascade;
drop table if exists pledge_payments cascade;
drop table if exists pledges cascade;
drop table if exists pledge_campaigns cascade;
drop table if exists donor_statement_runs cascade;
drop table if exists donations cascade;
drop table if exists donation_categories cascade;
drop table if exists attendance cascade;
drop table if exists services cascade;
drop table if exists service_locations cascade;
drop table if exists visitor_follow_ups cascade;
drop table if exists visitors cascade;
drop table if exists member_attachments cascade;
drop table if exists member_transfers cascade;
drop table if exists member_class_enrollments cascade;
drop table if exists membership_classes cascade;
drop table if exists member_status_history cascade;
drop table if exists member_emergency_contacts cascade;
drop table if exists member_profiles cascade;
drop table if exists members cascade;
drop table if exists clusters cascade;
drop table if exists church_settings cascade;
drop table if exists app_users cascade;

drop type if exists approval_status cascade;
drop type if exists equipment_condition cascade;
drop type if exists follow_up_task_status cascade;
drop type if exists follow_up_status cascade;
drop type if exists marital_status cascade;
drop type if exists member_attachment_type cascade;
drop type if exists membership_class_status cascade;
drop type if exists membership_status cascade;
drop type if exists notification_channel cascade;
drop type if exists notification_status cascade;
drop type if exists payment_method cascade;
drop type if exists pledge_status cascade;
drop type if exists service_type cascade;
drop type if exists service_status cascade;
drop type if exists sms_campaign_status cascade;
drop type if exists sms_target cascade;
drop type if exists transfer_direction cascade;

-- ----------------------------------------------------------------------------
-- Enum types
-- ----------------------------------------------------------------------------

create type membership_status as enum ('active', 'inactive', 'transferred', 'deceased');
create type marital_status as enum ('single', 'married', 'widowed', 'divorced');
create type service_type as enum ('Saturday', 'Midweek', 'Special');
create type service_status as enum ('open', 'closed');
create type payment_method as enum ('cash', 'mobile_money', 'bank_transfer', 'cheque', 'online');
create type pledge_status as enum ('pending', 'partial', 'fulfilled', 'cancelled');
create type approval_status as enum ('pending', 'approved', 'rejected');
create type equipment_condition as enum ('excellent', 'good', 'fair', 'poor', 'damaged');
create type sms_target as enum ('all_members', 'all_visitors', 'cluster', 'custom');
create type sms_campaign_status as enum ('draft', 'scheduled', 'sent', 'failed');
create type follow_up_status as enum ('pending', 'contacted', 'joined');
create type follow_up_task_status as enum ('pending', 'in_progress', 'completed', 'no_response');
create type membership_class_status as enum ('not_started', 'in_progress', 'completed', 'withdrawn');
create type transfer_direction as enum ('inbound', 'outbound');
create type member_attachment_type as enum ('profile_photo', 'baptism_certificate', 'membership_form', 'identification', 'other');
create type notification_channel as enum ('email', 'sms');
create type notification_status as enum ('scheduled', 'sent', 'failed', 'cancelled');

-- ----------------------------------------------------------------------------
-- Shared trigger helpers
-- ----------------------------------------------------------------------------

create or replace function public.touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ----------------------------------------------------------------------------
-- User profiles synced from auth.users
-- ----------------------------------------------------------------------------

create table app_users (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  email citext not null unique,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger touch_app_users_updated_at
before update on app_users
for each row execute procedure public.touch_updated_at();

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.app_users (id, full_name, email)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'full_name', new.email),
    new.email
  )
  on conflict (id) do update
  set full_name = excluded.full_name,
      email = excluded.email,
      updated_at = now();
  return new;
end;
$$;

create trigger on_auth_user_created
after insert on auth.users
for each row execute procedure public.handle_new_user();

-- ----------------------------------------------------------------------------
-- Core church administration tables
-- ----------------------------------------------------------------------------

create table church_settings (
  id integer primary key default 1,
  church_name text not null default 'My Church',
  address text,
  logo_url text,
  latitude numeric(10, 7),
  longitude numeric(10, 7),
  radius_metres integer not null default 500,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint church_settings_single_row check (id = 1)
);

create trigger touch_church_settings_updated_at
before update on church_settings
for each row execute procedure public.touch_updated_at();

insert into church_settings (id)
values (1)
on conflict (id) do nothing;

create table clusters (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  description text,
  leader_name text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger touch_clusters_updated_at
before update on clusters
for each row execute procedure public.touch_updated_at();

-- ----------------------------------------------------------------------------
-- Members and member-related tables
-- ----------------------------------------------------------------------------

create table members (
  id uuid primary key default gen_random_uuid(),
  member_number text unique,
  first_name text not null,
  last_name text not null,
  email citext unique,
  phone text,
  gender text,
  date_of_birth date,
  address text,
  occupation text,
  marital_status marital_status,
  baptism_date date,
  membership_status membership_status not null default 'active',
  cluster_id uuid references clusters(id) on delete set null,
  join_date date not null default current_date,
  profile_photo_url text,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger touch_members_updated_at
before update on members
for each row execute procedure public.touch_updated_at();

create index idx_members_cluster_id on members(cluster_id);
create index idx_members_membership_status on members(membership_status);
create index idx_members_join_date on members(join_date);

create table member_profiles (
  member_id uuid primary key references members(id) on delete cascade,
  preferred_name text,
  nationality text,
  hometown text,
  digital_address text,
  anniversary_date date,
  membership_class_notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger touch_member_profiles_updated_at
before update on member_profiles
for each row execute procedure public.touch_updated_at();

create table member_emergency_contacts (
  id uuid primary key default gen_random_uuid(),
  member_id uuid not null references members(id) on delete cascade,
  full_name text not null,
  phone text,
  relationship text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger touch_member_emergency_contacts_updated_at
before update on member_emergency_contacts
for each row execute procedure public.touch_updated_at();

create index idx_member_emergency_contacts_member_id on member_emergency_contacts(member_id);

create table member_status_history (
  id uuid primary key default gen_random_uuid(),
  member_id uuid not null references members(id) on delete cascade,
  from_status membership_status,
  to_status membership_status not null,
  effective_date date not null default current_date,
  note text,
  changed_by uuid references app_users(id) on delete set null,
  created_at timestamptz not null default now()
);

create index idx_member_status_history_member_id on member_status_history(member_id);

create table membership_classes (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  description text,
  sort_order integer not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger touch_membership_classes_updated_at
before update on membership_classes
for each row execute procedure public.touch_updated_at();

create table member_class_enrollments (
  id uuid primary key default gen_random_uuid(),
  member_id uuid not null references members(id) on delete cascade,
  class_id uuid not null references membership_classes(id) on delete cascade,
  status membership_class_status not null default 'not_started',
  started_at date,
  completed_at date,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (member_id, class_id)
);

create trigger touch_member_class_enrollments_updated_at
before update on member_class_enrollments
for each row execute procedure public.touch_updated_at();

create table member_transfers (
  id uuid primary key default gen_random_uuid(),
  member_id uuid not null references members(id) on delete cascade,
  direction transfer_direction not null,
  church_name text not null,
  transfer_date date not null,
  reason text,
  notes text,
  created_by uuid references app_users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger touch_member_transfers_updated_at
before update on member_transfers
for each row execute procedure public.touch_updated_at();

create table member_attachments (
  id uuid primary key default gen_random_uuid(),
  member_id uuid not null references members(id) on delete cascade,
  attachment_type member_attachment_type not null default 'other',
  file_name text not null,
  file_path text not null,
  mime_type text,
  file_size_bytes bigint,
  uploaded_by uuid references app_users(id) on delete set null,
  created_at timestamptz not null default now()
);

create index idx_member_attachments_member_id on member_attachments(member_id);

-- ----------------------------------------------------------------------------
-- Visitors and follow-up history
-- ----------------------------------------------------------------------------

create table visitors (
  id uuid primary key default gen_random_uuid(),
  first_name text not null,
  last_name text not null,
  email citext,
  phone text,
  how_heard text,
  invited_by text,
  visit_date date not null default current_date,
  follow_up_status follow_up_status not null default 'pending',
  notes text,
  converted_member_id uuid references members(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger touch_visitors_updated_at
before update on visitors
for each row execute procedure public.touch_updated_at();

create table visitor_follow_ups (
  id uuid primary key default gen_random_uuid(),
  visitor_id uuid not null references visitors(id) on delete cascade,
  status follow_up_status not null,
  note text,
  contacted_at timestamptz,
  created_by uuid references app_users(id) on delete set null,
  created_at timestamptz not null default now()
);

create index idx_visitor_follow_ups_visitor_id on visitor_follow_ups(visitor_id);

-- ----------------------------------------------------------------------------
-- Attendance and service management
-- ----------------------------------------------------------------------------

create table service_locations (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  address text,
  latitude numeric(10, 7),
  longitude numeric(10, 7),
  radius_metres integer not null default 500,
  notes text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger touch_service_locations_updated_at
before update on service_locations
for each row execute procedure public.touch_updated_at();

create table services (
  id uuid primary key default gen_random_uuid(),
  location_id uuid references service_locations(id) on delete set null,
  name text not null,
  service_date timestamptz not null,
  service_type service_type not null default 'Saturday',
  status service_status not null default 'open',
  expected_count integer,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger touch_services_updated_at
before update on services
for each row execute procedure public.touch_updated_at();

create index idx_services_service_date on services(service_date desc);

create table attendance (
  id uuid primary key default gen_random_uuid(),
  member_id uuid not null references members(id) on delete cascade,
  service_id uuid not null references services(id) on delete cascade,
  checked_in_at timestamptz not null default now(),
  latitude numeric(10, 7),
  longitude numeric(10, 7),
  created_by uuid references app_users(id) on delete set null,
  created_at timestamptz not null default now(),
  unique (member_id, service_id)
);

create index idx_attendance_service_id on attendance(service_id);
create index idx_attendance_member_id on attendance(member_id);

create or replace function public.prevent_check_in_closed_service()
returns trigger
language plpgsql
as $$
declare
  related_service_status service_status;
begin
  select status
    into related_service_status
    from services
   where id = new.service_id;

  if related_service_status = 'closed' then
    raise exception 'Cannot check in to a closed service';
  end if;

  return new;
end;
$$;

create trigger prevent_check_in_closed_service
before insert on attendance
for each row execute function public.prevent_check_in_closed_service();

-- ----------------------------------------------------------------------------
-- Finance
-- ----------------------------------------------------------------------------

create table donation_categories (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  description text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger touch_donation_categories_updated_at
before update on donation_categories
for each row execute procedure public.touch_updated_at();

insert into donation_categories (name, description)
values
  ('Tithe', 'Regular tithe contributions'),
  ('Offering', 'General offering collections'),
  ('Building Fund', 'Building and infrastructure contributions'),
  ('Mission', 'Mission support donations'),
  ('Welfare', 'Welfare and benevolence support'),
  ('Special', 'Special-purpose collections')
on conflict (name) do nothing;

create table donations (
  id uuid primary key default gen_random_uuid(),
  member_id uuid references members(id) on delete set null,
  donor_name text,
  category_id uuid references donation_categories(id) on delete set null,
  amount numeric(12, 2) not null,
  currency text not null default 'GHS',
  payment_method payment_method not null default 'cash',
  donation_date date not null default current_date,
  reference_number text,
  notes text,
  created_by uuid references app_users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger touch_donations_updated_at
before update on donations
for each row execute procedure public.touch_updated_at();

create index idx_donations_member_id on donations(member_id);
create index idx_donations_donation_date on donations(donation_date desc);

create table donor_statement_runs (
  id uuid primary key default gen_random_uuid(),
  member_id uuid not null references members(id) on delete cascade,
  period_start date not null,
  period_end date not null,
  generated_by uuid references app_users(id) on delete set null,
  file_path text,
  created_at timestamptz not null default now()
);

create table pledge_campaigns (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  target_amount numeric(12, 2),
  start_date date,
  end_date date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger touch_pledge_campaigns_updated_at
before update on pledge_campaigns
for each row execute procedure public.touch_updated_at();

create table pledges (
  id uuid primary key default gen_random_uuid(),
  campaign_id uuid not null references pledge_campaigns(id) on delete cascade,
  member_id uuid not null references members(id) on delete cascade,
  pledged_amount numeric(12, 2) not null,
  paid_amount numeric(12, 2) not null default 0,
  status pledge_status not null default 'pending',
  due_date date,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (campaign_id, member_id)
);

create trigger touch_pledges_updated_at
before update on pledges
for each row execute procedure public.touch_updated_at();

create table pledge_payments (
  id uuid primary key default gen_random_uuid(),
  pledge_id uuid not null references pledges(id) on delete cascade,
  amount numeric(12, 2) not null,
  payment_method payment_method not null default 'cash',
  payment_date date not null default current_date,
  reference_number text,
  notes text,
  created_by uuid references app_users(id) on delete set null,
  created_at timestamptz not null default now()
);

create index idx_pledge_payments_pledge_id on pledge_payments(pledge_id);

create table expense_categories (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  description text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger touch_expense_categories_updated_at
before update on expense_categories
for each row execute procedure public.touch_updated_at();

insert into expense_categories (name, description)
values
  ('Administration', 'Administrative and office-related expenses'),
  ('Utilities', 'Electricity, water, internet, and recurring utility costs'),
  ('Welfare', 'Welfare and benevolence support expenses'),
  ('Maintenance', 'Repairs, upkeep, and facilities maintenance'),
  ('Events', 'Programs, services, and event-related expenses')
on conflict (name) do nothing;

create table budgets (
  id uuid primary key default gen_random_uuid(),
  category_id uuid not null references expense_categories(id) on delete cascade,
  period_year integer not null,
  period_month integer,
  amount numeric(12, 2) not null,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (category_id, period_year, period_month)
);

create trigger touch_budgets_updated_at
before update on budgets
for each row execute procedure public.touch_updated_at();

create table expenses (
  id uuid primary key default gen_random_uuid(),
  category_id uuid references expense_categories(id) on delete set null,
  description text not null,
  amount numeric(12, 2) not null,
  currency text not null default 'GHS',
  expense_date date not null default current_date,
  payment_method payment_method not null default 'cash',
  approval_status approval_status not null default 'pending',
  approved_by uuid references app_users(id) on delete set null,
  approved_at timestamptz,
  notes text,
  created_by uuid references app_users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger touch_expenses_updated_at
before update on expenses
for each row execute procedure public.touch_updated_at();

create table expense_attachments (
  id uuid primary key default gen_random_uuid(),
  expense_id uuid not null references expenses(id) on delete cascade,
  file_name text not null,
  file_path text not null,
  mime_type text,
  file_size_bytes bigint,
  uploaded_by uuid references app_users(id) on delete set null,
  created_at timestamptz not null default now()
);

create index idx_expense_attachments_expense_id on expense_attachments(expense_id);

-- ----------------------------------------------------------------------------
-- Follow-up and engagement
-- ----------------------------------------------------------------------------

create table follow_up_tasks (
  id uuid primary key default gen_random_uuid(),
  member_id uuid not null references members(id) on delete cascade,
  cluster_id uuid references clusters(id) on delete set null,
  assigned_to text not null,
  reason text not null,
  due_date date,
  status follow_up_task_status not null default 'pending',
  notes text,
  created_by uuid references app_users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger touch_follow_up_tasks_updated_at
before update on follow_up_tasks
for each row execute procedure public.touch_updated_at();

create table sms_templates (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  body text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger touch_sms_templates_updated_at
before update on sms_templates
for each row execute procedure public.touch_updated_at();

create table sms_campaigns (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  message text not null,
  target sms_target not null default 'all_members',
  cluster_id uuid references clusters(id) on delete set null,
  scheduled_for timestamptz,
  sent_at timestamptz,
  status sms_campaign_status not null default 'draft',
  custom_recipient_payload jsonb,
  recipient_count integer,
  created_by uuid references app_users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger touch_sms_campaigns_updated_at
before update on sms_campaigns
for each row execute procedure public.touch_updated_at();

create table sms_campaign_recipients (
  id uuid primary key default gen_random_uuid(),
  campaign_id uuid not null references sms_campaigns(id) on delete cascade,
  member_id uuid references members(id) on delete set null,
  visitor_id uuid references visitors(id) on delete set null,
  recipient_name text,
  recipient_phone text not null,
  status sms_campaign_status not null default 'draft',
  error_message text,
  delivered_at timestamptz,
  created_at timestamptz not null default now()
);

create index idx_sms_campaign_recipients_campaign_id on sms_campaign_recipients(campaign_id);

create table notification_schedules (
  id uuid primary key default gen_random_uuid(),
  channel notification_channel not null,
  template_name text not null,
  member_id uuid references members(id) on delete cascade,
  visitor_id uuid references visitors(id) on delete cascade,
  service_id uuid references services(id) on delete cascade,
  follow_up_task_id uuid references follow_up_tasks(id) on delete cascade,
  scheduled_for timestamptz not null,
  payload jsonb not null default '{}'::jsonb,
  status notification_status not null default 'scheduled',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger touch_notification_schedules_updated_at
before update on notification_schedules
for each row execute procedure public.touch_updated_at();

create table notification_logs (
  id uuid primary key default gen_random_uuid(),
  schedule_id uuid references notification_schedules(id) on delete set null,
  channel notification_channel not null,
  recipient text not null,
  subject text,
  status notification_status not null,
  error_message text,
  provider_message_id text,
  sent_at timestamptz,
  created_at timestamptz not null default now()
);

-- ----------------------------------------------------------------------------
-- Equipment
-- ----------------------------------------------------------------------------

create table equipment (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  category text,
  serial_number text,
  purchase_date date,
  purchase_price numeric(12, 2),
  condition equipment_condition not null default 'good',
  location text,
  assigned_to text,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger touch_equipment_updated_at
before update on equipment
for each row execute procedure public.touch_updated_at();

-- ----------------------------------------------------------------------------
-- RLS
-- ----------------------------------------------------------------------------

alter table app_users enable row level security;
alter table church_settings enable row level security;
alter table clusters enable row level security;
alter table members enable row level security;
alter table member_profiles enable row level security;
alter table member_emergency_contacts enable row level security;
alter table member_status_history enable row level security;
alter table membership_classes enable row level security;
alter table member_class_enrollments enable row level security;
alter table member_transfers enable row level security;
alter table member_attachments enable row level security;
alter table visitors enable row level security;
alter table visitor_follow_ups enable row level security;
alter table service_locations enable row level security;
alter table services enable row level security;
alter table attendance enable row level security;
alter table donation_categories enable row level security;
alter table donations enable row level security;
alter table donor_statement_runs enable row level security;
alter table pledge_campaigns enable row level security;
alter table pledges enable row level security;
alter table pledge_payments enable row level security;
alter table expense_categories enable row level security;
alter table budgets enable row level security;
alter table expenses enable row level security;
alter table expense_attachments enable row level security;
alter table follow_up_tasks enable row level security;
alter table sms_templates enable row level security;
alter table sms_campaigns enable row level security;
alter table sms_campaign_recipients enable row level security;
alter table notification_schedules enable row level security;
alter table notification_logs enable row level security;
alter table equipment enable row level security;

create policy "authenticated_manage_app_users" on app_users
  for all using (auth.role() = 'authenticated')
  with check (auth.role() = 'authenticated');

create policy "authenticated_manage_church_settings" on church_settings
  for all using (auth.role() = 'authenticated')
  with check (auth.role() = 'authenticated');

create policy "anonymous_read_church_settings" on church_settings
  for select using (true);

create policy "authenticated_manage_clusters" on clusters
  for all using (auth.role() = 'authenticated')
  with check (auth.role() = 'authenticated');

create policy "anonymous_read_clusters" on clusters
  for select using (true);

create policy "authenticated_manage_members" on members
  for all using (auth.role() = 'authenticated')
  with check (auth.role() = 'authenticated');

create policy "anonymous_read_members" on members
  for select using (true);

create policy "authenticated_manage_member_profiles" on member_profiles
  for all using (auth.role() = 'authenticated')
  with check (auth.role() = 'authenticated');

create policy "authenticated_manage_member_emergency_contacts" on member_emergency_contacts
  for all using (auth.role() = 'authenticated')
  with check (auth.role() = 'authenticated');

create policy "authenticated_manage_member_status_history" on member_status_history
  for all using (auth.role() = 'authenticated')
  with check (auth.role() = 'authenticated');

create policy "authenticated_manage_membership_classes" on membership_classes
  for all using (auth.role() = 'authenticated')
  with check (auth.role() = 'authenticated');

create policy "authenticated_manage_member_class_enrollments" on member_class_enrollments
  for all using (auth.role() = 'authenticated')
  with check (auth.role() = 'authenticated');

create policy "authenticated_manage_member_transfers" on member_transfers
  for all using (auth.role() = 'authenticated')
  with check (auth.role() = 'authenticated');

create policy "authenticated_manage_member_attachments" on member_attachments
  for all using (auth.role() = 'authenticated')
  with check (auth.role() = 'authenticated');

create policy "authenticated_manage_visitors" on visitors
  for all using (auth.role() = 'authenticated')
  with check (auth.role() = 'authenticated');

create policy "authenticated_manage_visitor_follow_ups" on visitor_follow_ups
  for all using (auth.role() = 'authenticated')
  with check (auth.role() = 'authenticated');

create policy "authenticated_manage_service_locations" on service_locations
  for all using (auth.role() = 'authenticated')
  with check (auth.role() = 'authenticated');

create policy "authenticated_manage_services" on services
  for all using (auth.role() = 'authenticated')
  with check (auth.role() = 'authenticated');

create policy "anonymous_read_services" on services
  for select using (true);

create policy "authenticated_manage_attendance" on attendance
  for all using (auth.role() = 'authenticated')
  with check (auth.role() = 'authenticated');

create policy "anonymous_insert_attendance" on attendance
  for insert with check (true);

create policy "authenticated_manage_donation_categories" on donation_categories
  for all using (auth.role() = 'authenticated')
  with check (auth.role() = 'authenticated');

create policy "authenticated_manage_donations" on donations
  for all using (auth.role() = 'authenticated')
  with check (auth.role() = 'authenticated');

create policy "authenticated_manage_donor_statement_runs" on donor_statement_runs
  for all using (auth.role() = 'authenticated')
  with check (auth.role() = 'authenticated');

create policy "authenticated_manage_pledge_campaigns" on pledge_campaigns
  for all using (auth.role() = 'authenticated')
  with check (auth.role() = 'authenticated');

create policy "authenticated_manage_pledges" on pledges
  for all using (auth.role() = 'authenticated')
  with check (auth.role() = 'authenticated');

create policy "authenticated_manage_pledge_payments" on pledge_payments
  for all using (auth.role() = 'authenticated')
  with check (auth.role() = 'authenticated');

create policy "authenticated_manage_expense_categories" on expense_categories
  for all using (auth.role() = 'authenticated')
  with check (auth.role() = 'authenticated');

create policy "authenticated_manage_budgets" on budgets
  for all using (auth.role() = 'authenticated')
  with check (auth.role() = 'authenticated');

create policy "authenticated_manage_expenses" on expenses
  for all using (auth.role() = 'authenticated')
  with check (auth.role() = 'authenticated');

create policy "authenticated_manage_expense_attachments" on expense_attachments
  for all using (auth.role() = 'authenticated')
  with check (auth.role() = 'authenticated');

create policy "authenticated_manage_follow_up_tasks" on follow_up_tasks
  for all using (auth.role() = 'authenticated')
  with check (auth.role() = 'authenticated');

create policy "authenticated_manage_sms_templates" on sms_templates
  for all using (auth.role() = 'authenticated')
  with check (auth.role() = 'authenticated');

create policy "authenticated_manage_sms_campaigns" on sms_campaigns
  for all using (auth.role() = 'authenticated')
  with check (auth.role() = 'authenticated');

create policy "authenticated_manage_sms_campaign_recipients" on sms_campaign_recipients
  for all using (auth.role() = 'authenticated')
  with check (auth.role() = 'authenticated');

create policy "authenticated_manage_notification_schedules" on notification_schedules
  for all using (auth.role() = 'authenticated')
  with check (auth.role() = 'authenticated');

create policy "authenticated_manage_notification_logs" on notification_logs
  for all using (auth.role() = 'authenticated')
  with check (auth.role() = 'authenticated');

create policy "authenticated_manage_equipment" on equipment
  for all using (auth.role() = 'authenticated')
  with check (auth.role() = 'authenticated');
