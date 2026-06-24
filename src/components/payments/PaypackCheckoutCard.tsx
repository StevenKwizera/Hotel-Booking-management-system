import type { ReactNode } from "react";
import { Icon } from "@/components/ui/Icon";
import { PaypackPhoneField } from "@/components/payments/PaypackPhoneField";
import { isValidEmail } from "@/lib/payment-receipt";

interface PaypackCheckoutCardProps {
  amountRwf: number;
  summary?: ReactNode;
  meta?: string;
  payPhone: string;
  onPayPhoneChange: (phone: string) => void;
  email: string;
  onEmailChange: (email: string) => void;
  emailPlaceholder?: string;
  paying?: boolean;
  polling?: boolean;
  waitingForMoMo?: boolean;
  payMessage?: string | null;
  showCheckStatus?: boolean;
  onPay: () => void;
  onCheckStatus?: () => void;
  disabled?: boolean;
}

export function PaypackCheckoutCard({
  amountRwf,
  summary,
  meta,
  payPhone,
  onPayPhoneChange,
  email,
  onEmailChange,
  emailPlaceholder = "you@example.com",
  paying = false,
  polling = false,
  waitingForMoMo = false,
  payMessage,
  showCheckStatus = false,
  onPay,
  onCheckStatus,
  disabled = false,
}: PaypackCheckoutCardProps) {
  const formLocked = disabled || polling || waitingForMoMo;
  const canPay =
    !paying &&
    !polling &&
    !waitingForMoMo &&
    !disabled &&
    payPhone.trim().length > 0 &&
    email.trim().length > 0 &&
    isValidEmail(email);

  return (
    <div className="mx-auto w-full max-w-sm">
      <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-lg shadow-slate-200/50 dark:border-slate-700/80 dark:bg-slate-900 dark:shadow-none">
        <div className="flex items-center justify-between gap-3 bg-gradient-to-br from-emerald-600 via-emerald-600 to-teal-600 px-4 py-3 text-white">
          <div className="flex min-w-0 items-center gap-2.5">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white/15 backdrop-blur-sm">
              <Icon name="Smartphone" className="h-4 w-4" />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold leading-tight">Complete payment</p>
              <p className="truncate text-[11px] text-white/80">MTN MoMo · Paypack</p>
            </div>
          </div>
          <div className="shrink-0 rounded-xl bg-white/15 px-2.5 py-1 text-right backdrop-blur-sm">
            <p className="text-[10px] font-medium uppercase tracking-wide text-white/70">Total</p>
            <p className="font-display text-base font-bold leading-tight">
              RWF {amountRwf.toLocaleString()}
            </p>
          </div>
        </div>

        <div className="space-y-3 p-4">
          {meta && (
            <p className="text-[11px] leading-snug text-[var(--text-muted)]">{meta}</p>
          )}

          {summary && (
            <div className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-muted)]/50 px-3 py-2.5 text-xs">
              {summary}
            </div>
          )}

          <p className="text-xs leading-relaxed text-[var(--text-secondary)]">
            Approve the MoMo prompt on your phone — we confirm automatically.
          </p>

          {(polling || waitingForMoMo) && (
            <div className="flex items-start gap-2 rounded-xl border border-amber-200/80 bg-amber-50 px-3 py-2 text-xs text-amber-900 dark:border-amber-800/40 dark:bg-amber-950/30 dark:text-amber-100">
              <Icon name="Loader2" className="mt-0.5 h-3.5 w-3.5 shrink-0 animate-spin" />
              <p>
                {polling
                  ? "Checking Paypack… approve on your phone if you haven't yet."
                  : "Still waiting — tap Check status or we'll keep checking."}
              </p>
            </div>
          )}

          <PaypackPhoneField
            compact
            value={payPhone}
            onChange={onPayPhoneChange}
            disabled={formLocked}
          />

          <label className="block">
            <span className="text-xs font-medium text-[var(--text-secondary)]">
              Email for receipt
            </span>
            <input
              type="email"
              value={email}
              onChange={(e) => onEmailChange(e.target.value)}
              placeholder={emailPlaceholder}
              autoComplete="email"
              disabled={formLocked}
              className="mt-1 w-full rounded-lg border border-[var(--border-default)] bg-[var(--bg-elevated)] px-3 py-2 text-sm outline-none transition focus:border-emerald-500/50 focus:ring-2 focus:ring-emerald-500/20 disabled:opacity-60"
            />
          </label>

          {payMessage && (
            <p className="rounded-lg bg-emerald-50 px-3 py-2 text-xs text-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-100">
              {payMessage}
            </p>
          )}

          <div className="flex gap-2 pt-1">
            <button
              type="button"
              onClick={onPay}
              disabled={!canPay}
              className="flex-1 rounded-xl bg-emerald-600 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-700 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
            >
              {paying ? "Starting…" : polling ? "Checking…" : `Pay RWF ${amountRwf.toLocaleString()}`}
            </button>
            {showCheckStatus && onCheckStatus && (
              <button
                type="button"
                onClick={onCheckStatus}
                disabled={polling}
                className="rounded-xl border border-emerald-600/40 px-3 py-2.5 text-xs font-semibold text-emerald-700 transition hover:bg-emerald-50 disabled:opacity-50 dark:text-emerald-300 dark:hover:bg-emerald-950/40"
              >
                Check
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
