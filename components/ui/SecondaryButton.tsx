import { ButtonHTMLAttributes } from "react";

export function SecondaryButton({ className = "", ...props }: ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      className={`border border-slate-200 text-slate-700 rounded-lg px-4 py-2 font-semibold bg-white transition-colors hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 ${className}`}
      {...props}
    />
  );
}
