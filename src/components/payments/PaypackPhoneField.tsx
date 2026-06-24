import {
  isMtnRwandaPhone,
  PAYPACK_MOMO_PHONES,
  normalizeMtnPhoneInput,
} from "@/lib/payment-providers";

interface PaypackPhoneFieldProps {
  value: string;
  onChange: (phone: string) => void;
  label?: string;
  hint?: string;
  suggestedPhones?: readonly string[];
  disabled?: boolean;
  compact?: boolean;
}

export function PaypackPhoneField({
  value,
  onChange,
  label = "Your MTN MoMo number",
  hint = "Enter the MTN number that will receive the MoMo prompt, or pick one below (078… or 079…)",
  suggestedPhones = PAYPACK_MOMO_PHONES,
  disabled = false,
  compact = false,
}: PaypackPhoneFieldProps) {
  const showHint = value.trim().length > 0 && !isMtnRwandaPhone(value);
  const compactHint = "078… or 079… — or tap a number below";

  return (
    <div className="block">
      <label>
        <span
          className={`font-medium text-[var(--text-secondary)] ${compact ? "text-xs" : "text-sm"}`}
        >
          {compact ? "MoMo number" : label}
        </span>
        <input
          type="tel"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="078XXXXXXX or 079XXXXXXX"
          autoComplete="tel"
          disabled={disabled}
          className={`mt-1 w-full rounded-lg border border-[var(--border-default)] bg-[var(--bg-elevated)] px-3 text-sm outline-none transition focus:border-emerald-500/50 focus:ring-2 focus:ring-emerald-500/20 disabled:opacity-60 ${
            compact ? "py-2" : "py-2"
          }`}
        />
      </label>
      {suggestedPhones.length > 0 && (
        <div className={`flex flex-wrap items-center gap-1.5 ${compact ? "mt-1.5" : "mt-2"}`}>
          {!compact && <span className="text-xs text-[var(--text-muted)]">Use:</span>}
          {suggestedPhones.map((phone) => {
            const selected = normalizeMtnPhoneInput(value) === phone;
            return (
              <button
                key={phone}
                type="button"
                disabled={disabled}
                onClick={() => onChange(phone)}
                className={`rounded-full border font-medium transition disabled:opacity-60 ${
                  compact ? "px-2 py-0.5 text-[10px]" : "px-3 py-1 text-xs"
                } ${
                  selected
                    ? "border-emerald-500 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300"
                    : "border-[var(--border-default)] bg-[var(--bg-elevated)] text-[var(--text-secondary)] hover:border-emerald-500/40"
                }`}
              >
                {phone}
              </button>
            );
          })}
        </div>
      )}
      {showHint ? (
        <p className="mt-1 text-[11px] text-[var(--danger)]">
          Use a valid MTN number (078… or 079…)
        </p>
      ) : (
        hint &&
        !compact && <p className="mt-1 text-xs text-[var(--text-muted)]">{hint}</p>
      )}
      {compact && !showHint && (
        <p className="mt-1 text-[10px] text-[var(--text-muted)]">{compactHint}</p>
      )}
    </div>
  );
}
