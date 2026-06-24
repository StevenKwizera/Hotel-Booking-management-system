import { Card, CardHeader } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Icon } from "@/components/ui/Icon";
import type { AiOverviewApi } from "@/lib/api";

const STEP_ICONS: Record<string, string> = {
  collect: "Database",
  analyze: "LineChart",
  recommend: "Sparkles",
  predict: "Brain",
  forecast: "TrendingUp",
  pricing: "CircleDollarSign",
  optimize: "ConciergeBell",
  insights: "BarChart3",
};

const STEP_COLORS = [
  "border-sky-200 bg-sky-50/80 dark:border-sky-500/30 dark:bg-sky-950/30",
  "border-violet-200 bg-violet-50/80 dark:border-violet-500/30 dark:bg-violet-950/30",
  "border-amber-200 bg-amber-50/80 dark:border-amber-500/30 dark:bg-amber-950/30",
  "border-teal-200 bg-teal-50/80 dark:border-teal-500/30 dark:bg-teal-950/30",
  "border-rose-200 bg-rose-50/80 dark:border-rose-500/30 dark:bg-rose-950/30",
  "border-orange-200 bg-orange-50/80 dark:border-orange-500/30 dark:bg-orange-950/30",
  "border-indigo-200 bg-indigo-50/80 dark:border-indigo-500/30 dark:bg-indigo-950/30",
  "border-yellow-200 bg-yellow-50/80 dark:border-yellow-500/30 dark:bg-yellow-950/30",
];

export function AiPipelinePanel({ pipeline }: { pipeline: AiOverviewApi["pipeline"] }) {
  return (
    <div className="space-y-3">
      {pipeline.map((step, i) => (
        <Card
          key={step.id}
          className={`border ${STEP_COLORS[i % STEP_COLORS.length] ?? "border-[var(--border-subtle)]"}`}
        >
          <div className="flex gap-4 p-4">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white/60 dark:bg-black/20">
              <Icon name={STEP_ICONS[step.id] ?? "Sparkles"} className="h-5 w-5 text-[var(--text-primary)]" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="font-semibold text-[var(--text-primary)]">{step.title}</h3>
                <Badge variant="success">{step.status}</Badge>
              </div>
              <p className="mt-1 text-sm text-[var(--text-muted)]">{step.summary}</p>
              <dl className="mt-3 grid gap-2 sm:grid-cols-2">
                {step.signals.map((s) => (
                  <div
                    key={s.label}
                    className="rounded-lg border border-white/50 bg-white/50 px-3 py-2 dark:border-white/10 dark:bg-black/10"
                  >
                    <dt className="text-[10px] font-semibold uppercase tracking-wide text-[var(--text-muted)]">
                      {s.label}
                    </dt>
                    <dd className="text-sm font-medium text-[var(--text-primary)]">{s.value}</dd>
                  </div>
                ))}
              </dl>
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
}

export function GuestAiAnalysisPanel({
  analysis,
}: {
  analysis: NonNullable<AiOverviewApi["guestAnalysis"]>;
}) {
  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <Card>
        <CardHeader
          title="Your AI profile"
          subtitle={
            analysis.returningGuest
              ? "Returning guest — patterns from your past stays"
              : "Building your preference profile"
          }
        />
        <dl className="grid gap-3 sm:grid-cols-2">
          <div>
            <dt className="text-xs text-[var(--text-muted)]">Segment</dt>
            <dd className="font-medium">{analysis.guestSegment}</dd>
          </div>
          <div>
            <dt className="text-xs text-[var(--text-muted)]">Preferred room</dt>
            <dd className="font-medium">{analysis.preferredRoomType}</dd>
          </div>
          <div>
            <dt className="text-xs text-[var(--text-muted)]">Visits</dt>
            <dd className="font-medium">{analysis.visitCount}</dd>
          </div>
          <div>
            <dt className="text-xs text-[var(--text-muted)]">Status</dt>
            <dd className="font-medium">{analysis.returningGuest ? "Returning guest" : "New guest"}</dd>
          </div>
        </dl>
      </Card>
      <Card>
        <CardHeader title="Detected patterns" subtitle="From bookings, services & payments" />
        <ul className="space-y-2">
          {analysis.patterns.map((p) => (
            <li key={p.pattern} className="rounded-lg border border-[var(--border-subtle)] px-3 py-2">
              <p className="text-sm font-medium">{p.pattern}</p>
              <p className="text-xs text-[var(--text-muted)]">{p.detail}</p>
            </li>
          ))}
        </ul>
      </Card>
      <Card className="lg:col-span-2">
        <CardHeader title="Predicted needs" subtitle="What AI expects you may want next" />
        <ul className="grid gap-3 sm:grid-cols-2">
          {analysis.predictions.map((p) => (
            <li
              key={p.title}
              className="rounded-xl border border-violet-200/80 bg-violet-50/50 p-4 dark:border-violet-500/30 dark:bg-violet-950/20"
            >
              <div className="flex items-start justify-between gap-2">
                <p className="font-medium">{p.title}</p>
                <Badge variant="success">{p.confidence}%</Badge>
              </div>
              <p className="mt-1 text-sm text-[var(--text-muted)]">{p.detail}</p>
            </li>
          ))}
        </ul>
      </Card>
    </div>
  );
}

export function ManagementAiInsightsPanel({
  insights,
}: {
  insights: NonNullable<AiOverviewApi["managementInsights"]>;
}) {
  return (
    <div className="space-y-4">
      <Card>
        <CardHeader title="Occupancy forecast" subtitle="Next 7 days — from booking history" />
        <div className="grid gap-2 sm:grid-cols-7">
          {insights.occupancyForecast.map((d) => (
            <div
              key={d.day}
              className="rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-muted)]/50 p-3 text-center"
            >
              <p className="text-xs font-medium text-[var(--text-muted)]">{d.day}</p>
              <p className="text-xl font-semibold">{d.predictedOccupancyPct}%</p>
              <p className="text-[10px] capitalize text-[var(--text-muted)]">{d.trend}</p>
            </div>
          ))}
        </div>
      </Card>
      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader title="Dynamic pricing" subtitle="Suggested rates based on demand" />
          <ul className="space-y-3">
            {insights.dynamicPricing.map((p) => (
              <li key={p.roomType} className="rounded-lg border border-[var(--border-subtle)] p-3">
                <div className="flex justify-between gap-2">
                  <span className="font-medium">{p.roomType}</span>
                  <span className="text-sm text-[var(--text-muted)]">
                    RWF {p.baseRateRwf.toLocaleString()} →{" "}
                    <strong>RWF {p.suggestedRateRwf.toLocaleString()}</strong>
                  </span>
                </div>
                <p className="mt-1 text-xs text-[var(--text-muted)]">{p.reason}</p>
              </li>
            ))}
          </ul>
        </Card>
        <Card>
          <CardHeader title="Service optimization" subtitle="Peak demand by service type" />
          <ul className="space-y-3">
            {insights.serviceOptimization.map((s) => (
              <li key={s.serviceType} className="rounded-lg border border-[var(--border-subtle)] p-3">
                <div className="flex justify-between">
                  <span className="font-medium capitalize">{s.serviceType}</span>
                  <Badge variant="info">{s.requestCount} requests</Badge>
                </div>
                <p className="text-xs text-[var(--text-muted)]">Peak: {s.peakPeriod}</p>
                <p className="mt-1 text-sm">{s.recommendation}</p>
              </li>
            ))}
          </ul>
        </Card>
      </div>
      <Card>
        <CardHeader title="Strategic insights" subtitle="For management decisions" />
        <ul className="list-disc space-y-2 pl-5 text-sm text-[var(--text-secondary)]">
          {insights.strategicInsights.map((s) => (
            <li key={s}>{s}</li>
          ))}
        </ul>
      </Card>
    </div>
  );
}
