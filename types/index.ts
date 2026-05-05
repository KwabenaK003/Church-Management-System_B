export type MembershipStatus = "active" | "inactive" | "transferred" | "deceased";
export type FollowUpStatus = "pending" | "contacted" | "joined";
export type ServiceType = "Saturday" | "Midweek" | "Special";
export type ServiceStatus = "open" | "closed";
export type PaymentMethod = "cash" | "mobile_money" | "bank_transfer" | "cheque" | "online";
export type PledgeStatus = "pending" | "partial" | "fulfilled" | "cancelled";
export type ApprovalStatus = "pending" | "approved" | "rejected";
export type EquipmentCondition = "excellent" | "good" | "fair" | "poor" | "damaged";
export type SMSTarget = "all_members" | "all_visitors" | "cluster" | "custom";
export type SMSCampaignStatus = "draft" | "scheduled" | "sent" | "failed";
export type FollowUpTaskStatus = "pending" | "in_progress" | "completed" | "no_response";
export type MaritalStatus = "single" | "married" | "widowed" | "divorced";
export type MembershipClassStatus = "not_started" | "in_progress" | "completed" | "withdrawn";
export type TransferDirection = "inbound" | "outbound";
export type MemberAttachmentType = "profile_photo" | "baptism_certificate" | "membership_form" | "identification" | "other";
export type NotificationChannel = "email" | "sms";
export type NotificationStatus = "scheduled" | "sent" | "failed" | "cancelled";

export interface AppUser {
  id: string;
  full_name?: string;
  email: string;
  created_at: string;
  updated_at: string;
}

export interface Cluster {
  id: string;
  name: string;
  description?: string;
  leader_name?: string;
  created_at: string;
  updated_at?: string;
}

export interface ServiceLocation {
  id: string;
  name: string;
  address?: string;
  latitude?: number;
  longitude?: number;
  radius_metres: number;
  notes?: string;
  is_active?: boolean;
  created_at: string;
  updated_at?: string;
}

export interface MemberProfile {
  member_id: string;
  preferred_name?: string;
  nationality?: string;
  hometown?: string;
  digital_address?: string;
  anniversary_date?: string;
  membership_class_notes?: string;
  created_at?: string;
  updated_at?: string;
}

export interface MemberEmergencyContact {
  id: string;
  member_id: string;
  full_name: string;
  phone?: string;
  relationship?: string;
  created_at: string;
  updated_at?: string;
}

export interface StatusHistoryEntry {
  from?: MembershipStatus;
  to: MembershipStatus;
  date: string;
  note?: string;
}

export interface MemberStatusHistory {
  id: string;
  member_id: string;
  from_status?: MembershipStatus;
  to_status: MembershipStatus;
  effective_date: string;
  note?: string;
  changed_by?: string;
  changed_by_user?: Pick<AppUser, "id" | "full_name" | "email">;
  created_at: string;
}

export interface MembershipClass {
  id: string;
  name: string;
  description?: string;
  sort_order: number;
  is_active: boolean;
  created_at: string;
  updated_at?: string;
}

export interface MemberClassEnrollment {
  id: string;
  member_id: string;
  class_id: string;
  status: MembershipClassStatus;
  started_at?: string;
  completed_at?: string;
  notes?: string;
  membership_class?: MembershipClass;
  created_at: string;
  updated_at?: string;
}

export interface MemberTransfer {
  id: string;
  member_id: string;
  direction: TransferDirection;
  church_name: string;
  transfer_date: string;
  reason?: string;
  notes?: string;
  created_by?: string;
  created_at: string;
  updated_at?: string;
}

export interface MemberAttachment {
  id: string;
  member_id: string;
  attachment_type: MemberAttachmentType;
  file_name: string;
  file_path: string;
  mime_type?: string;
  file_size_bytes?: number;
  uploaded_by?: string;
  created_at: string;
}

export interface Member {
  id: string;
  member_number?: string;
  first_name: string;
  last_name: string;
  email?: string;
  phone?: string;
  gender?: string;
  date_of_birth?: string;
  address?: string;
  occupation?: string;
  marital_status?: MaritalStatus;
  baptism_date?: string;
  membership_status: MembershipStatus;
  cluster_id?: string;
  cluster?: Cluster;
  join_date: string;
  profile_photo_url?: string;
  notes?: string;
  profile?: MemberProfile;
  emergency_contacts?: MemberEmergencyContact[];
  status_history?: StatusHistoryEntry[];
  status_history_entries?: MemberStatusHistory[];
  class_enrollments?: MemberClassEnrollment[];
  transfers?: MemberTransfer[];
  attachments?: MemberAttachment[];
  emergency_contact_name?: string;
  emergency_contact_phone?: string;
  emergency_contact_relationship?: string;
  created_at: string;
  updated_at?: string;
}

export interface VisitorFollowUp {
  id: string;
  visitor_id: string;
  status: FollowUpStatus;
  note?: string;
  contacted_at?: string;
  created_by?: string;
  created_at: string;
}

export interface Visitor {
  id: string;
  first_name: string;
  last_name: string;
  email?: string;
  phone?: string;
  how_heard?: string;
  visit_date: string;
  invited_by?: string;
  follow_up_status: FollowUpStatus;
  notes?: string;
  converted_member_id?: string;
  converted_member?: Pick<Member, "id" | "first_name" | "last_name">;
  follow_ups?: VisitorFollowUp[];
  created_at: string;
  updated_at?: string;
}

export interface Service {
  id: string;
  location_id?: string;
  service_location?: ServiceLocation;
  name: string;
  service_date: string;
  service_type: ServiceType;
  status: ServiceStatus;
  expected_count?: number;
  notes?: string;
  created_at: string;
  updated_at?: string;
}

export interface Attendance {
  id: string;
  member_id: string;
  service_id: string;
  checked_in_at: string;
  latitude?: number;
  longitude?: number;
  created_by?: string;
  created_at?: string;
  member?: Pick<Member, "id" | "first_name" | "last_name">;
  service?: Pick<Service, "id" | "name" | "service_date">;
}

export interface DonationCategory {
  id: string;
  name: string;
  description?: string;
  created_at: string;
  updated_at?: string;
}

export interface Donation {
  id: string;
  member_id?: string;
  donor_name?: string;
  category_id?: string;
  category?: DonationCategory;
  member?: Pick<Member, "id" | "first_name" | "last_name">;
  amount: number;
  currency: string;
  payment_method: PaymentMethod;
  donation_date: string;
  reference_number?: string;
  notes?: string;
  created_by?: string;
  created_at: string;
  updated_at?: string;
}

export interface DonorStatementRun {
  id: string;
  member_id: string;
  member?: Pick<Member, "id" | "first_name" | "last_name">;
  period_start: string;
  period_end: string;
  generated_by?: string;
  file_path?: string;
  created_at: string;
}

export interface PledgeCampaign {
  id: string;
  name: string;
  description?: string;
  target_amount?: number;
  start_date?: string;
  end_date?: string;
  created_at: string;
  updated_at?: string;
}

export interface PledgePayment {
  id: string;
  pledge_id: string;
  amount: number;
  payment_method: PaymentMethod;
  payment_date: string;
  reference_number?: string;
  notes?: string;
  created_by?: string;
  created_at: string;
}

export interface Pledge {
  id: string;
  campaign_id: string;
  campaign?: PledgeCampaign;
  member_id: string;
  member?: Pick<Member, "id" | "first_name" | "last_name">;
  pledged_amount: number;
  paid_amount: number;
  status: PledgeStatus;
  due_date?: string;
  notes?: string;
  payments?: PledgePayment[];
  created_at: string;
  updated_at?: string;
}

export interface ExpenseCategory {
  id: string;
  name: string;
  description?: string;
  budget_amount?: number;
  created_at: string;
  updated_at?: string;
}

export interface Budget {
  id: string;
  category_id: string;
  category?: ExpenseCategory;
  period_year: number;
  period_month?: number;
  amount: number;
  notes?: string;
  created_at: string;
  updated_at?: string;
}

export interface ExpenseAttachment {
  id: string;
  expense_id: string;
  file_name: string;
  file_path: string;
  mime_type?: string;
  file_size_bytes?: number;
  uploaded_by?: string;
  created_at: string;
}

export interface Expense {
  id: string;
  category_id?: string;
  category?: ExpenseCategory;
  description: string;
  amount: number;
  currency: string;
  expense_date: string;
  payment_method: PaymentMethod;
  receipt_url?: string;
  attachments?: ExpenseAttachment[];
  approval_status: ApprovalStatus;
  approved_by?: string;
  approved_at?: string;
  notes?: string;
  created_by?: string;
  created_at: string;
  updated_at?: string;
}

export interface SMSTemplate {
  id: string;
  name: string;
  body: string;
  created_at: string;
  updated_at?: string;
}

export interface SMSCampaignRecipient {
  id: string;
  campaign_id: string;
  member_id?: string;
  visitor_id?: string;
  recipient_name?: string;
  recipient_phone: string;
  status: SMSCampaignStatus;
  error_message?: string;
  delivered_at?: string;
  created_at: string;
}

export interface SMSCampaign {
  id: string;
  name: string;
  message: string;
  target: SMSTarget;
  cluster_id?: string;
  cluster?: Cluster;
  scheduled_for?: string;
  sent_at?: string;
  status: SMSCampaignStatus;
  custom_recipient_payload?: unknown;
  recipient_count?: number;
  recipients?: SMSCampaignRecipient[];
  created_by?: string;
  created_at: string;
  updated_at?: string;
}

export interface FollowUpTask {
  id: string;
  member_id: string;
  member?: Pick<Member, "id" | "first_name" | "last_name">;
  cluster_id?: string;
  cluster?: Cluster;
  assigned_to: string;
  reason: string;
  due_date?: string;
  status: FollowUpTaskStatus;
  notes?: string;
  created_by?: string;
  created_at: string;
  updated_at?: string;
}

export interface NotificationSchedule {
  id: string;
  channel: NotificationChannel;
  template_name: string;
  member_id?: string;
  visitor_id?: string;
  service_id?: string;
  follow_up_task_id?: string;
  scheduled_for: string;
  payload: Record<string, unknown>;
  status: NotificationStatus;
  created_at: string;
  updated_at?: string;
}

export interface NotificationLog {
  id: string;
  schedule_id?: string;
  channel: NotificationChannel;
  recipient: string;
  subject?: string;
  status: NotificationStatus;
  error_message?: string;
  provider_message_id?: string;
  sent_at?: string;
  created_at: string;
}

export interface Equipment {
  id: string;
  name: string;
  category?: string;
  serial_number?: string;
  purchase_date?: string;
  purchase_price?: number;
  condition: EquipmentCondition;
  location?: string;
  assigned_to?: string;
  notes?: string;
  created_at: string;
  updated_at?: string;
}

export interface ChurchSettings {
  id: number;
  church_name: string;
  address?: string;
  logo_url?: string;
  latitude?: number;
  longitude?: number;
  radius_metres: number;
  created_at?: string;
  updated_at: string;
}
