import type { ReactNode } from "react";
import { Icon } from "@/components/ui/Icon";
import { Button } from "@/components/ui/Button";

interface EmptyStateProps {
  icon?: string;
  title: string;
  description?: string;
  action?: ReactNode;
}

export function EmptyState({ icon = "Inbox", title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-[var(--border-default)] bg-[var(--bg-muted)]/50 px-6 py-12 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[var(--accent)]/10">
        <Icon name={icon} className="h-7 w-7 text-[var(--accent)]" />
      </div>
      <p className="mt-4 font-display text-lg font-semibold text-[var(--text-primary)]">{title}</p>
      {description && (
        <p className="mt-2 max-w-sm text-sm text-[var(--text-muted)]">{description}</p>
      )}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

interface EmptyStateButtonProps {
  label: string;
  onClick: () => void;
}

export function EmptyStateButton({ label, onClick }: EmptyStateButtonProps) {
  return (
    <Button variant="outline" size="sm" onClick={onClick}>
      {label}
    </Button>
  );
}
