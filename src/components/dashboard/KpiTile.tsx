import { Icon } from "@/components/ui/Icon";
import { TONE_STYLES, type DashTone } from "@/lib/dashboard-theme";

interface KpiTileProps {
  label: string;
  value: string;
  icon: string;
  tone: DashTone;
  change?: string;
}

export function KpiTile({ label, value, icon, tone, change }: KpiTileProps) {
  const s = TONE_STYLES[tone];
  return (
    <div
      className={`flex items-center gap-4 rounded-xl border p-4 shadow-[var(--shadow-card)] ring-1 ${s.border} ${s.cardBg} ${s.ring}`}
    >
      <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ${s.iconBg}`}>
        <Icon name={icon} className={`h-6 w-6 ${s.iconText}`} />
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-2xl font-semibold tracking-tight text-[var(--text-primary)]">
          {value}
        </p>
        <p className="text-sm text-[var(--text-muted)]">{label}</p>
        {change && <p className="mt-0.5 text-xs font-medium text-[var(--text-secondary)]">{change}</p>}
      </div>
    </div>
  );
}
