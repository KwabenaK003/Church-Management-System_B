export const ROLES = ["Admin", "Pastor", "Department Leader"] as const;
export type Role = (typeof ROLES)[number];

export const MEMBERSHIP_STATUSES = ["active", "inactive", "visitor"] as const;
export const FOLLOW_UP_STATUSES = ["pending", "contacted", "joined"] as const;
export const SERVICE_TYPES = ["Saturday", "Midweek", "Special"] as const;

export const EMAIL_TEMPLATES = {
  welcome: "welcome-email",
  reminder: "attendance-reminder",
  visitorFollowUp: "visitor-followup",
} as const;

export const COLORS = {
  primary: "#2563EB",
  primaryHover: "#1D4ED8",
  background: "#FFFFFF",
  pageBackground: "#F8FAFC",
  border: "#E2E8F0",
  text: "#0F172A",
  textSecondary: "#64748B",
  success: "#16A34A",
  warning: "#D97706",
  danger: "#DC2626",
} as const;
