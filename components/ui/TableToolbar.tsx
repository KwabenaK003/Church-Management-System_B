"use client";

import type { ReactNode } from "react";
import { X } from "@phosphor-icons/react";
import { Button } from "@/components/ui/Button";

type TableToolbarProps = {
  selectedCount: number;
  onClearSelection: () => void;
  children?: ReactNode;
};

export function TableToolbar({
  selectedCount,
  onClearSelection,
  children,
}: TableToolbarProps) {
  if (selectedCount <= 0) {
    return null;
  }

  return (
    <div className="mb-3 flex items-center justify-between gap-3 rounded-lg border border-[var(--blue-200)] bg-[var(--blue-50)] px-4 py-2.5 text-[var(--blue-700)]">
      <p className="text-sm font-medium">
        {selectedCount} selected
      </p>

      <div className="flex items-center gap-2">
        {children}
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={onClearSelection}
          className="text-[var(--blue-700)] hover:bg-[var(--blue-200)]"
        >
          <X size={14} weight="bold" aria-hidden="true" />
          Clear selection
        </Button>
      </div>
    </div>
  );
}
