"use client";

import { useToastStore, ToastVariant } from "@/lib/stores/toastStore";
import { CheckCircle, WarningCircle, Info, XCircle, X } from "@phosphor-icons/react";

const variantStyles: Record<ToastVariant, string> = {
  success: "bg-[var(--success-bg)] text-[var(--success-text)] border-green-200",
  error: "bg-[var(--danger-bg)] text-[var(--danger-text)] border-red-200",
  warning: "bg-[var(--warning-bg)] text-[var(--warning-text)] border-amber-200",
  info: "bg-[var(--info-bg)] text-[var(--info-text)] border-[var(--blue-200)]",
};

const icons: Record<ToastVariant, React.ReactNode> = {
  success: <CheckCircle size={18} weight="fill" />,
  error: <XCircle size={18} weight="fill" />,
  warning: <WarningCircle size={18} weight="fill" />,
  info: <Info size={18} weight="fill" />,
};

export function ToastContainer() {
  const { toasts, removeToast } = useToastStore();

  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-5 right-5 z-[100] flex flex-col gap-2.5">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`flex items-center gap-2.5 rounded-xl border px-4 py-3 text-sm font-medium shadow-md animate-slide-up ${variantStyles[toast.variant]}`}
        >
          {icons[toast.variant]}
          <span>{toast.message}</span>
          <button
            onClick={() => removeToast(toast.id)}
            className="ml-2 rounded-md p-0.5 opacity-60 hover:opacity-100 transition-opacity"
          >
            <X size={14} />
          </button>
        </div>
      ))}
    </div>
  );
}
