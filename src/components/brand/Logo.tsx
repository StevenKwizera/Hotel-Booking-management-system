interface LogoProps {
  size?: number;
  showWordmark?: boolean;
  variant?: "full" | "mark" | "sidebar";
  className?: string;
}

export function Logo({
  size = 40,
  showWordmark = false,
  variant = "mark",
  className = "",
}: LogoProps) {
  const mark = (
    <svg
      width={size}
      height={size}
      viewBox="0 0 120 120"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`shrink-0 ${className}`}
      aria-hidden
    >
      <defs>
        <linearGradient id="orkestra-brand" x1="20" y1="10" x2="100" y2="110">
          <stop stopColor="var(--accent)" />
          <stop offset="1" stopColor="var(--accent-hover)" />
        </linearGradient>
      </defs>
      <rect
        width="120"
        height="120"
        rx={variant === "sidebar" ? 22 : 28}
        fill={variant === "sidebar" ? "rgba(255,255,255,0.06)" : "var(--bg-surface)"}
        stroke={variant === "sidebar" ? "rgba(255,255,255,0.08)" : "var(--border-subtle)"}
        strokeWidth="1"
      />
      <circle
        cx="60"
        cy="60"
        r="42"
        stroke="url(#orkestra-brand)"
        strokeWidth="2"
        opacity="0.35"
      />
      <path
        d="M36 78V42c0 0 8 10 12 10s12-10 12-10v36"
        stroke="url(#orkestra-brand)"
        strokeWidth="5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M60 42v36M72 52l12-10v36"
        stroke="url(#orkestra-brand)"
        strokeWidth="5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="60" cy="34" r="4" fill="url(#orkestra-brand)" />
    </svg>
  );

  if (!showWordmark) return mark;

  return (
    <div className={`flex items-center gap-3 ${className}`}>
      {mark}
      <div className="min-w-0 leading-none">
        <span className="font-display text-xl font-semibold tracking-wide text-[var(--text-primary)]">
          Orkestra
        </span>
        <span className="mt-0.5 block text-[10px] uppercase tracking-[0.2em] text-[var(--text-muted)]">
          Hospitality
        </span>
      </div>
    </div>
  );
}
