import "server-only";

import { Resend } from "resend";
import type { ReactElement } from "react";
import { EMAIL_TEMPLATES } from "@/constants";
import WelcomeEmail from "@/emails/WelcomeEmail";
import AttendanceReminder from "@/emails/AttendanceReminder";
import VisitorFollowUp from "@/emails/VisitorFollowUp";

const resendKey = process.env.RESEND_API_KEY;
const fromEmail = process.env.RESEND_FROM_EMAIL ?? "onboarding@resend.dev";

export type EmailTemplatePayload = Record<string, unknown>;

type TemplateComponent = (props: EmailTemplatePayload) => ReactElement;

const TEMPLATE_COMPONENTS: Record<string, TemplateComponent | undefined> = {
  [EMAIL_TEMPLATES.welcome]: WelcomeEmail as unknown as TemplateComponent,
  [EMAIL_TEMPLATES.reminder]: AttendanceReminder as unknown as TemplateComponent,
  [EMAIL_TEMPLATES.visitorFollowUp]: VisitorFollowUp as unknown as TemplateComponent,
};

export async function sendEmail(
  to: string,
  subject: string,
  template: string,
  data: EmailTemplatePayload
) {
  if (!resendKey) {
    return { success: false, error: new Error("Missing RESEND_API_KEY") };
  }

  const resend = new Resend(resendKey);
  const EmailComponent = TEMPLATE_COMPONENTS[template];

  const message = {
    from: fromEmail,
    to,
    subject,
    react: EmailComponent ? EmailComponent(data) : undefined,
    html: EmailComponent ? undefined : "<p>Email template missing.</p>",
  };

  try {
    await resend.emails.send(message);
    return { success: true };
  } catch (error) {
    console.error("Resend error", error);
    return { success: false, error };
  }
}

export async function sendHtmlEmail(to: string, subject: string, html: string, text?: string) {
  if (!resendKey) {
    return { success: false, error: new Error("Missing RESEND_API_KEY") };
  }

  const resend = new Resend(resendKey);

  try {
    const { error } = await resend.emails.send({
      from: fromEmail,
      to,
      subject,
      html,
      text,
    });

    if (error) {
      return { success: false, error };
    }

    return { success: true };
  } catch (error) {
    console.error("Resend error", error);
    return { success: false, error };
  }
}
