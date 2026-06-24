import { getPaymentProvider, type PaymentProvider } from "@/lib/payment-providers";

interface PaymentProviderLogoProps {
  provider: PaymentProvider | string;
  size?: "sm" | "md" | "lg";
  className?: string;
}

const SIZES = { sm: 36, md: 44, lg: 52 };

export function PaymentProviderLogo({ provider, size = "md", className = "" }: PaymentProviderLogoProps) {
  const p = typeof provider === "string" ? getPaymentProvider(provider) : provider;
  const px = SIZES[size];

  if (!p) {
    return (
      <div
        className={`flex shrink-0 items-center justify-center rounded-lg bg-[var(--bg-muted)] font-bold text-[var(--text-muted)] ${className}`}
        style={{ width: px, height: px, fontSize: px * 0.28 }}
      >
        ?
      </div>
    );
  }

  return (
    <div
      className={`flex shrink-0 items-center justify-center rounded-lg font-bold shadow-sm ring-1 ring-black/10 ${className}`}
      style={{
        width: px,
        height: px,
        background: p.brandColor,
        color: p.textColor,
        fontSize: px * 0.26,
      }}
      title={p.label}
      aria-hidden
    >
      {p.shortLabel}
    </div>
  );
}
