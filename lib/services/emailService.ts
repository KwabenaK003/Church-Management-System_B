import "server-only";

import { supabase } from "@/lib/supabase";
import { EmailTemplatePayload } from "@/lib/email";
import { Member, Visitor } from "@/types";
import { EMAIL_TEMPLATES } from "@/constants";
import { sendEmail } from "@/lib/email";

interface LogPayload {
  recipient_email: string;
  subject: string;
  type: string;
  status: string;
}

async function logEmail(payload: LogPayload) {
  await supabase.from("email_logs").insert({
    ...payload,
    sent_at: new Date().toISOString(),
  });
}

export async function sendWelcomeEmail(member: Member) {
  const template = EMAIL_TEMPLATES.welcome;
  const subject = "Welcome to the Church Family";
  const data: EmailTemplatePayload = {
    firstName: member.first_name,
    lastName: member.last_name,
  };

  if (!member.email) return { success: false, error: "No email" };
  const result = await sendEmail(member.email, subject, template, data);
  await logEmail({
    recipient_email: member.email,
    subject,
    type: "welcome",
    status: result.success ? "sent" : "failed",
  });

  return result;
}

export async function sendAttendanceReminder(serviceId: string, serviceName: string, recipients: string[]) {
  const template = EMAIL_TEMPLATES.reminder;
  const subject = `Reminder: ${serviceName} is coming up`;
  const data: EmailTemplatePayload = {
    serviceName,
  };

  const results = [];
  for (const email of recipients) {
    const result = await sendEmail(email, subject, template, data);
    await logEmail({
      recipient_email: email,
      subject,
      type: "reminder",
      status: result.success ? "sent" : "failed",
    });
    results.push(result);
  }

  return results;
}

export async function sendVisitorFollowUp(visitor: Visitor) {
  if (!visitor.email) {
    throw new Error("Visitor email is required for follow-up");
  }
  const template = EMAIL_TEMPLATES.visitorFollowUp;
  const subject = "Thank you for visiting";
  const data: EmailTemplatePayload = {
    firstName: visitor.first_name,
    notes: visitor.notes ?? "",
  };

  const result = await sendEmail(visitor.email, subject, template, data);
  await logEmail({
    recipient_email: visitor.email,
    subject,
    type: "followup",
    status: result.success ? "sent" : "failed",
  });

  return result;
}
