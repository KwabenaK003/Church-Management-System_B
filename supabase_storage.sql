-- ============================================================================
-- Church Management System — Storage Buckets And Policies
-- Run after supabase_schema.sql
-- ============================================================================

-- ----------------------------------------------------------------------------
-- Buckets
-- ----------------------------------------------------------------------------

insert into storage.buckets (id, name, public)
values
  ('profile-photos', 'profile-photos', true),
  ('member-attachments', 'member-attachments', false),
  ('expense-receipts', 'expense-receipts', false),
  ('church-assets', 'church-assets', true),
  ('exports', 'exports', false)
on conflict (id) do nothing;

-- ----------------------------------------------------------------------------
-- Policy cleanup
-- ----------------------------------------------------------------------------

drop policy if exists "Public read profile photos" on storage.objects;
drop policy if exists "Authenticated upload profile photos" on storage.objects;
drop policy if exists "Authenticated update profile photos" on storage.objects;
drop policy if exists "Authenticated delete profile photos" on storage.objects;
drop policy if exists "Authenticated manage member attachments" on storage.objects;
drop policy if exists "Authenticated manage expense receipts" on storage.objects;
drop policy if exists "Public read church assets" on storage.objects;
drop policy if exists "Authenticated manage church assets" on storage.objects;
drop policy if exists "Authenticated manage exports" on storage.objects;

-- ----------------------------------------------------------------------------
-- Profile photos
-- ----------------------------------------------------------------------------

create policy "Public read profile photos" on storage.objects
  for select using (bucket_id = 'profile-photos');

create policy "Authenticated upload profile photos" on storage.objects
  for insert with check (bucket_id = 'profile-photos' and auth.role() = 'authenticated');

create policy "Authenticated update profile photos" on storage.objects
  for update using (bucket_id = 'profile-photos' and auth.role() = 'authenticated');

create policy "Authenticated delete profile photos" on storage.objects
  for delete using (bucket_id = 'profile-photos' and auth.role() = 'authenticated');

-- ----------------------------------------------------------------------------
-- Member attachments
-- ----------------------------------------------------------------------------

create policy "Authenticated manage member attachments" on storage.objects
  for all using (bucket_id = 'member-attachments' and auth.role() = 'authenticated')
  with check (bucket_id = 'member-attachments' and auth.role() = 'authenticated');

-- ----------------------------------------------------------------------------
-- Expense receipts
-- ----------------------------------------------------------------------------

create policy "Authenticated manage expense receipts" on storage.objects
  for all using (bucket_id = 'expense-receipts' and auth.role() = 'authenticated')
  with check (bucket_id = 'expense-receipts' and auth.role() = 'authenticated');

-- ----------------------------------------------------------------------------
-- Church assets such as logos
-- ----------------------------------------------------------------------------

create policy "Public read church assets" on storage.objects
  for select using (bucket_id = 'church-assets');

create policy "Authenticated manage church assets" on storage.objects
  for all using (bucket_id = 'church-assets' and auth.role() = 'authenticated')
  with check (bucket_id = 'church-assets' and auth.role() = 'authenticated');

-- ----------------------------------------------------------------------------
-- Generated exports
-- ----------------------------------------------------------------------------

create policy "Authenticated manage exports" on storage.objects
  for all using (bucket_id = 'exports' and auth.role() = 'authenticated')
  with check (bucket_id = 'exports' and auth.role() = 'authenticated');
