interface BookingPriceBreakdownProps {
  nightlyRate: number;
  nights: number;
  subtotal: number;
  discountRwf: number;
  payable: number;
  earlyBookingDiscount?: boolean;
  repeatGuestDiscount?: boolean;
  compact?: boolean;
}

export function BookingPriceBreakdown({
  nightlyRate,
  nights,
  subtotal,
  discountRwf,
  payable,
  earlyBookingDiscount = false,
  repeatGuestDiscount = false,
  compact = false,
}: BookingPriceBreakdownProps) {
  const safeSubtotal = subtotal ?? 0;
  const safeDiscount = discountRwf ?? 0;
  const safePayable = payable ?? safeSubtotal - safeDiscount;
  const safeNightly = nightlyRate ?? 0;
  const safeNights = nights > 0 ? nights : 1;
  const hasDiscount = safeDiscount > 0;

  return (
    <div className={`space-y-2 text-sm ${compact ? "" : "mt-3"}`}>
      <div className="flex flex-wrap justify-between gap-2">
        <span className="text-[var(--text-muted)]">
          Room rate ({safeNightly.toLocaleString()}/night × {safeNights} night{safeNights === 1 ? "" : "s"})
        </span>
        <span className="font-medium text-[var(--text-primary)]">RWF {safeSubtotal.toLocaleString()}</span>
      </div>

      {earlyBookingDiscount && (
        <div className="flex flex-wrap justify-between gap-2 text-emerald-700 dark:text-emerald-300">
          <span>Early booking discount (5% — 14+ days ahead)</span>
          <span>− RWF {Math.round(safeSubtotal * 0.05).toLocaleString()}</span>
        </div>
      )}

      {repeatGuestDiscount && (
        <div className="flex flex-wrap justify-between gap-2 text-emerald-700 dark:text-emerald-300">
          <span>Loyal guest discount (10% — 3+ stays)</span>
          <span>− RWF {Math.round(safeSubtotal * 0.1).toLocaleString()}</span>
        </div>
      )}

      {hasDiscount && !earlyBookingDiscount && !repeatGuestDiscount && (
        <div className="flex flex-wrap justify-between gap-2 text-emerald-700 dark:text-emerald-300">
          <span>Discount</span>
          <span>− RWF {safeDiscount.toLocaleString()}</span>
        </div>
      )}

      {hasDiscount && (
        <div className="flex flex-wrap justify-between gap-2 border-t border-[var(--border-subtle)] pt-2">
          <span className="text-[var(--text-muted)]">Total discount</span>
          <span className="font-medium text-emerald-700 dark:text-emerald-300">
            − RWF {safeDiscount.toLocaleString()}
          </span>
        </div>
      )}

      <div className="flex flex-wrap items-baseline justify-between gap-2 border-t border-[var(--border-subtle)] pt-2">
        <span className="font-medium text-[var(--text-primary)]">You pay</span>
        <strong className={`font-display ${compact ? "text-xl" : "text-2xl"} text-[var(--text-primary)]`}>
          RWF {safePayable.toLocaleString()}
        </strong>
      </div>
    </div>
  );
}
