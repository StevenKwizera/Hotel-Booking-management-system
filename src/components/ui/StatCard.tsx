import { Icon } from "./Icon";
import { TONE_STYLES, type DashTone } from "@/lib/dashboard-theme";
import type { KpiMetric } from "@/types";

interface StatCardProps {
  metric: KpiMetric;
  tone?: DashTone;
}

export function StatCard({ metric, tone = "sapphire" }: StatCardProps) {
  const s = TONE_STYLES[tone];
  const trendColor =
    metric.trend === "up"
      ? "text-emerald-600 dark:text-emerald-400"
      : metric.trend === "down"
        ? "text-rose-600 dark:text-rose-400"
        : "text-[var(--text-muted)]";

  return (
    <div
      className={`rounded-xl border p-5 shadow-[var(--shadow-card)] transition-transform hover:-translate-y-0.5 ${s.border} ${s.cardBg} ring-1 ${s.ring}`}
    >
      <div className="flex items-start justify-between">
        <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${s.iconBg}`}>
          <Icon name={metric.icon} className={`h-5 w-5 ${s.iconText}`} />
        </div>
        {metric.change !== undefined && (
          <span className={`text-xs font-medium ${trendColor}`}>
            {metric.change > 0 ? "+" : ""}
            {metric.change}%
          </span>
        )}
      </div>
      <p className="mt-4 text-2xl font-semibold tracking-tight text-[var(--text-primary)]">
        {metric.value}
      </p>
      <p className="mt-1 text-sm text-[var(--text-muted)]">{metric.label}</p>
    </div>
  );
}
