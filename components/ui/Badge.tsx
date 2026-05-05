import { ReactNode } from "react";

type Tone = "success" | "warning" | "danger" | "primary" | "info" | "neutral";

const toneStyles: Record<Tone, string> = {
  success: "bg-[var(--success-bg)] text-[var(--success-text)]",
  warning: "bg-[var(--warning-bg)] text-[var(--warning-text)]",
  danger:  "bg-[var(--danger-bg)] text-[var(--danger-text)]",
  primary: "bg-[var(--blue-50)] text-[var(--blue-700)]",
  info:    "bg-[var(--info-bg)] text-[var(--info-text)]",
  neutral: "bg-[var(--neutral-bg)] text-[var(--neutral-text)]",
};

interface BadgeProps {
  tone?: Tone;
  children: React.ReactNode;
  className?: string;
}

export function Badge({ tone = "neutral", children, className = "" }: BadgeProps) {
  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${toneStyles[tone]} ${className}`}
    >
      {children}
    </span>
  );
}
