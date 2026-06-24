interface FilterChipProps {
  label: string;
  active: boolean;
  onClick: () => void;
}

export function FilterChip({ label, active, onClick }: FilterChipProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`cursor-pointer rounded-full border px-3 py-1.5 text-xs font-medium transition-all active:scale-95 ${
        active
          ? "border-[var(--accent)] bg-[var(--accent)]/12 text-[var(--accent)]"
          : "border-[var(--border-default)] text-[var(--text-secondary)] hover:border-[var(--accent)]/40 hover:bg-[var(--bg-muted)]"
      }`}
    >
      {label}
    </button>
  );
}
