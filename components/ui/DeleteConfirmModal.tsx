"use client";

import { Warning } from "@phosphor-icons/react";
import { Modal } from "./Modal";
import { Button } from "./Button";
import { SecondaryButton } from "./SecondaryButton";

export interface DeleteConfirmModalProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void> | void;
  title?: string;
  description: string;
  isPending?: boolean;
  confirmLabel?: string;
  cancelLabel?: string;
}

export function DeleteConfirmModal({
  open,
  onClose,
  onConfirm,
  title = "Delete Confirmation",
  description,
  isPending = false,
  confirmLabel = "Delete",
  cancelLabel = "Cancel",
}: DeleteConfirmModalProps) {
  const handleClose = () => {
    if (!isPending) {
      onClose();
    }
  };

  return (
    <Modal open={open} onClose={handleClose} title={title} size="sm">
      <div className="flex flex-col gap-4">
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4">
          <div className="bg-red-100 text-red-600 p-2.5 rounded-full shrink-0 flex items-center justify-center">
            <Warning size={24} weight="fill" />
          </div>
          <p className="text-slate-600 text-sm sm:mt-1.5 text-center sm:text-left">
            {description}
          </p>
        </div>

        <div className="mt-6 flex flex-col-reverse sm:flex-row items-center justify-end gap-3">
          <SecondaryButton 
            disabled={isPending} 
            onClick={handleClose}
            className="w-full sm:w-auto"
          >
            {cancelLabel}
          </SecondaryButton>
          <Button
            variant="danger"
            disabled={isPending}
            onClick={onConfirm}
            className="w-full sm:w-auto"
          >
            {isPending ? "Deleting..." : confirmLabel}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
