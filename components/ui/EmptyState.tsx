import { ReactNode } from "react";
import { FolderOpen, FolderOpenIcon } from "@phosphor-icons/react";

interface EmptyStateProps {
  icon?: ReactNode;
  title?: string;
  description?: string;
  action?: ReactNode;
}

export function EmptyState({ icon, title = "No data", description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center gap-3">
      <div className="w-12 h-12 p-2 rounded-full bg-slate-100 flex items-center justify-center text-slate-400">
        {icon ?? <FolderOpenIcon className="w-10 h-10" />}
      </div>
      <div>
        <p className="text-sm font-medium text-slate-700">{title}</p>
        {description && <p className="text-xs text-slate-400 mt-1">{description}</p>}
      </div>
      {action && <div className="mt-2">{action}</div>}
    </div>
  );
}
