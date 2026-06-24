import { useMemo } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Card, CardHeader } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import { EmptyState } from "@/components/ui/EmptyState";
import { useAppActions } from "@/context/AppActionsContext";
import { useBackendData } from "@/context/BackendDataContext";
import { analyticsFromOccupancy } from "@/lib/page-helpers";
import { KpiTile } from "@/components/dashboard/KpiTile";
import { toneForKpi } from "@/lib/dashboard-theme";
import { useAuth } from "@/context/AuthContext";

export function AnalyticsSection() {
  const { exportData } = useAppActions();
  const { occupancy, kpis, loading } = useBackendData();
  const { user } = useAuth();
  const role = user?.role ?? "management";

  const chartData = occupancy.length > 0 ? occupancy : [];

  const kpiTiles = useMemo(() => {
    if (kpis.length >= 4) {
      return kpis.slice(0, 4).map((k) => ({ label: k.label, value: k.value }));
    }
    return analyticsFromOccupancy(occupancy);
  }, [kpis, occupancy]);

  return (
    <section id="kpis" className="space-y-6">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-violet-600 dark:text-violet-400">
          Analytics
        </p>
        <h2 className="mt-1 font-display text-2xl font-semibold">Live KPIs & trends</h2>
        <p className="mt-1 text-sm text-[var(--text-muted)]">
          Operational metrics from your hotel database — export or generate formal reports below.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {loading && kpiTiles.length === 0 ? (
          <p className="col-span-full text-sm text-[var(--text-muted)]">Loading analytics…</p>
        ) : (
          kpiTiles.map((k, i) => (
            <KpiTile
              key={k.label}
              label={k.label}
              value={String(k.value)}
              icon="BarChart3"
              tone={toneForKpi(role, i)}
            />
          ))
        )}
      </div>

      <Card>
        <CardHeader
          title="Revenue vs occupancy"
          subtitle="Last 7 days from operational database"
          action={
            <Button
              variant="outline"
              size="sm"
              icon={<Icon name="Download" className="h-4 w-4" />}
              onClick={() => exportData("orkestra-analytics-export.json", { occupancy, kpis })}
              disabled={chartData.length === 0}
            >
              Export JSON
            </Button>
          }
        />
        <div className="h-72">
          {chartData.length === 0 ? (
            <EmptyState
              icon="BarChart3"
              title="No chart data yet"
              description="Start the backend and seed the database to load occupancy and revenue trends."
            />
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border-subtle)" />
                <XAxis dataKey="day" tick={{ fill: "var(--text-muted)", fontSize: 12 }} />
                <YAxis yAxisId="left" tick={{ fill: "var(--text-muted)", fontSize: 12 }} />
                <YAxis
                  yAxisId="right"
                  orientation="right"
                  tick={{ fill: "var(--text-muted)", fontSize: 12 }}
                />
                <Tooltip
                  contentStyle={{
                    background: "var(--bg-surface)",
                    border: "1px solid var(--border-default)",
                    borderRadius: "8px",
                  }}
                />
                <Legend />
                <Bar
                  yAxisId="left"
                  dataKey="occupancy"
                  fill="var(--accent)"
                  name="Occupancy %"
                  radius={[4, 4, 0, 0]}
                />
                <Bar
                  yAxisId="right"
                  dataKey="revenue"
                  fill="var(--success)"
                  name="Revenue (M RWF)"
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </Card>
    </section>
  );
}
