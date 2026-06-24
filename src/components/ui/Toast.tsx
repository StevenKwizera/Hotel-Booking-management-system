import { Icon } from "./Icon";
import { useAppActions } from "@/context/AppActionsContext";
import type { ToastType } from "@/context/AppActionsContext";

const icons: Record<ToastType, string> = {
  success: "CheckCircle2",
  info: "Info",
  warning: "AlertTriangle",
  error: "XCircle",
};

const styles: Record<ToastType, string> = {
  success: "border-[var(--success)]/30 bg-[var(--success)]/8",
  info: "border-[var(--accent)]/30 bg-[var(--accent)]/8",
  warning: "border-[var(--warning)]/30 bg-[var(--warning)]/8",
  error: "border-[var(--danger)]/30 bg-[var(--danger)]/8",
};

export function ToastContainer() {
  const { toasts, dismissToast } = useAppActions();

  if (toasts.length === 0) return null;

  return (
    <div
      className="pointer-events-none fixed bottom-6 right-6 z-[100] flex flex-col gap-2"
      aria-live="polite"
    >
      {toasts.map((t) => (
        <div
          key={t.id}
          className={`pointer-events-auto flex min-w-[280px] max-w-sm items-start gap-3 rounded-xl border px-4 py-3 shadow-lg backdrop-blur-md ${styles[t.type]}`}
          style={{ background: "var(--bg-surface)" }}
        >
          <Icon name={icons[t.type]} className="mt-0.5 h-5 w-5 shrink-0 text-[var(--accent)]" />
          <p className="flex-1 text-sm text-[var(--text-primary)]">{t.message}</p>
          <button
            type="button"
            onClick={() => dismissToast(t.id)}
            className="shrink-0 rounded p-1 hover:bg-[var(--bg-muted)]"
            aria-label="Dismiss"
          >
            <Icon name="X" className="h-4 w-4 text-[var(--text-muted)]" />
          </button>
        </div>
      ))}
    </div>
  );
}
