import { ReactNode } from "react";

interface CardProps {
  title?: string;
  children: ReactNode;
  className?: string;
}

export function Card({ title, children, className = "" }: CardProps) {
  return (
    <div className={`bg-white border border-slate-200 rounded-2xl p-6 ${className}`}>
      {title && <p className="text-sm font-semibold text-slate-500 mb-3">{title}</p>}
      {children}
    </div>
  );
}
