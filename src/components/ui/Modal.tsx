import type { ReactNode } from "react";
import { Icon } from "./Icon";
import { Button } from "./Button";

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  children: ReactNode;
  footer?: ReactNode;
  size?: "sm" | "md" | "lg";
}

export function Modal({
  open,
  onClose,
  title,
  subtitle,
  children,
  footer,
  size = "md",
}: ModalProps) {
  if (!open) return null;

  const widths = { sm: "max-w-md", md: "max-w-lg", lg: "max-w-2xl" };

  return (
    <>
      <div
        className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden
      />
      <div
        className="fixed inset-0 z-50 flex items-center justify-center p-4"
        role="dialog"
        aria-modal
        aria-labelledby="modal-title"
      >
        <div
          className={`w-full ${widths[size]} max-h-[90vh] overflow-hidden rounded-2xl border border-[var(--border-default)] bg-[var(--bg-surface)] shadow-2xl`}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-start justify-between border-b border-[var(--border-subtle)] px-6 py-5">
            <div>
              <h2 id="modal-title" className="font-display text-xl font-semibold">
                {title}
              </h2>
              {subtitle && (
                <p className="mt-1 text-sm text-[var(--text-muted)]">{subtitle}</p>
              )}
            </div>
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg p-2 hover:bg-[var(--bg-muted)]"
              aria-label="Close"
            >
              <Icon name="X" className="h-5 w-5" />
            </button>
          </div>
          <div className="overflow-y-auto px-6 py-5">{children}</div>
          {footer && (
            <div className="flex justify-end gap-2 border-t border-[var(--border-subtle)] px-6 py-4">
              {footer}
            </div>
          )}
        </div>
      </div>
    </>
  );
}

export function ModalFooter({
  onCancel,
  onConfirm,
  confirmLabel = "Save",
  cancelLabel = "Cancel",
  loading = false,
}: {
  onCancel: () => void;
  onConfirm: () => void;
  confirmLabel?: string;
  cancelLabel?: string;
  loading?: boolean;
}) {
  return (
    <>
      <Button variant="outline" onClick={onCancel} disabled={loading}>
        {cancelLabel}
      </Button>
      <Button onClick={onConfirm} loading={loading}>
        {confirmLabel}
      </Button>
    </>
  );
}
