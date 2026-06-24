import type { ButtonHTMLAttributes, ReactNode } from "react";
import { Icon } from "./Icon";

type Variant = "primary" | "secondary" | "ghost" | "danger" | "outline";
type Size = "sm" | "md" | "lg";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  children: ReactNode;
  icon?: ReactNode;
  loading?: boolean;
}

const variants: Record<Variant, string> = {
  primary:
    "bg-[var(--accent)] text-white hover:bg-[var(--accent-hover)] shadow-sm focus-visible:ring-2 focus-visible:ring-[var(--accent)]/40",
  secondary:
    "bg-[var(--bg-muted)] text-[var(--text-primary)] hover:bg-[var(--border-default)] focus-visible:ring-2 focus-visible:ring-[var(--accent)]/30",
  ghost:
    "bg-transparent text-[var(--text-secondary)] hover:bg-[var(--bg-muted)] focus-visible:ring-2 focus-visible:ring-[var(--accent)]/30",
  danger:
    "bg-[var(--danger)] text-white hover:opacity-90 focus-visible:ring-2 focus-visible:ring-[var(--danger)]/40",
  outline:
    "border border-[var(--border-default)] bg-transparent text-[var(--text-primary)] hover:bg-[var(--bg-muted)] hover:border-[var(--accent)]/40 focus-visible:ring-2 focus-visible:ring-[var(--accent)]/30",
};

const sizes: Record<Size, string> = {
  sm: "px-3 py-1.5 text-xs gap-1.5 min-h-8",
  md: "px-4 py-2 text-sm gap-2 min-h-10",
  lg: "px-5 py-2.5 text-base gap-2 min-h-11",
};

export function Button({
  variant = "primary",
  size = "md",
  children,
  icon,
  loading = false,
  className = "",
  disabled,
  ...props
}: ButtonProps) {
  return (
    <button
      type="button"
      disabled={disabled || loading}
      className={`inline-flex cursor-pointer items-center justify-center rounded-lg font-medium transition-all duration-200 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50 disabled:pointer-events-none disabled:active:scale-100 ${variants[variant]} ${sizes[size]} ${className}`}
      {...props}
    >
      {loading ? (
        <Icon name="Loader2" className="h-4 w-4 animate-spin" />
      ) : (
        icon
      )}
      {children}
    </button>
  );
}
