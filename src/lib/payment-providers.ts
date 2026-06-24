/** Paypack — sole payment channel for Net Luna Villa / Orkestra */

export type PaymentProviderCategory = "mobile";

export interface PaymentProvider {
  id: string;
  label: string;
  shortLabel: string;
  category: PaymentProviderCategory;
  apiMethod: string;
  brandColor: string;
  textColor: string;
  description: string;
}

export const PAYMENT_PROVIDERS: PaymentProvider[] = [
  {
    id: "paypack",
    label: "Paypack MoMo",
    shortLabel: "PP",
    category: "mobile",
    apiMethod: "Paypack",
    brandColor: "#0D9488",
    textColor: "#FFFFFF",
    description: "MTN & Airtel mobile money via Paypack",
  },
];

export const PAYMENT_CATEGORIES: { id: PaymentProviderCategory; label: string }[] = [
  { id: "mobile", label: "Paypack mobile money" },
];

export const PAYPACK_METHOD = "Paypack";

/** MTN MoMo numbers guests can use for Paypack payments */
export const PAYPACK_MOMO_PHONES = ["0789738349", "0789403583"] as const;

export function getPaymentProvider(idOrLabel: string): PaymentProvider | undefined {
  const key = idOrLabel.toLowerCase().replace(/\s+/g, "");
  return PAYMENT_PROVIDERS.find(
    (p) =>
      p.id === idOrLabel ||
      p.apiMethod.toLowerCase().replace(/\s+/g, "") === key ||
      p.label.toLowerCase().replace(/\s+/g, "") === key ||
      key.includes("paypack"),
  );
}

export function resolvePaymentMethodLabel(_method?: string): string {
  return "Paypack MoMo";
}

/** Rwanda MTN MoMo: 078xxxxxxx or 079xxxxxxx (also accepts +250 78/79…). */
export function normalizeMtnPhoneInput(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  if (digits.startsWith("250") && digits.length >= 12) {
    return "0" + digits.slice(3);
  }
  if (digits.length === 9 && digits.startsWith("7")) {
    return "0" + digits;
  }
  if (digits.length === 10 && digits.startsWith("0")) {
    return digits;
  }
  return phone.trim();
}

export function isMtnRwandaPhone(phone: string): boolean {
  const local = normalizeMtnPhoneInput(phone);
  return /^07(8|9)\d{7}$/.test(local);
}
