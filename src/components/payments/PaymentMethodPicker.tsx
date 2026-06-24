import { PAYMENT_PROVIDERS } from "@/lib/payment-providers";
import { PaymentProviderLogo } from "@/components/payments/PaymentProviderLogo";

/** Paypack is the only payment channel — informational display */
export function PaymentMethodPicker() {
  const paypack = PAYMENT_PROVIDERS[0];
  return (
    <div className="flex items-center gap-3 rounded-xl border border-teal-200/50 bg-teal-50/30 p-4 dark:border-teal-500/25 dark:bg-teal-950/20">
      <PaymentProviderLogo provider={paypack} size="md" />
      <div>
        <p className="font-medium text-[var(--text-primary)]">{paypack.label}</p>
        <p className="text-sm text-[var(--text-muted)]">{paypack.description}</p>
      </div>
    </div>
  );
}
