import { useCallback, useEffect, useState } from "react";
import { Card, CardHeader } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import { useAppActions } from "@/context/AppActionsContext";
import { api, ApiError, type FinanceRevenueApi } from "@/lib/api";

function fmt(n: number) {
  return `RWF ${n.toLocaleString()}`;
}

export function RevenueMonitorPanel() {
  const { showToast } = useAppActions();
  const [data, setData] = useState<FinanceRevenueApi | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setData(await api.getFinanceRevenue());
    } catch (e) {
      showToast(e instanceof ApiError ? e.message : "Could not load revenue", "error");
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <section id="revenue">
      <Card>
        <CardHeader
          title="Revenue monitor"
          subtitle="Today, week, and month collections — live from payment ledger"
          action={
            <Button
              size="sm"
              variant="outline"
              icon={<Icon name="RefreshCw" className="h-4 w-4" />}
              onClick={load}
            >
              Refresh
            </Button>
          }
        />
        {loading ? (
          <p className="py-8 text-center text-sm text-[var(--text-muted)]">Loading revenue…</p>
        ) : !data ? null : (
          <>
            <div className="grid gap-3 sm:grid-cols-3">
              {[
                { label: "Today", value: fmt(data.todayRevenueRwf) },
                { label: "Last 7 days", value: fmt(data.weekRevenueRwf) },
                { label: "This month", value: fmt(data.monthRevenueRwf) },
              ].map((s) => (
                <div
                  key={s.label}
                  className="rounded-xl border border-violet-200/40 bg-violet-50/30 p-4 dark:border-violet-500/20 dark:bg-violet-950/20"
                >
                  <p className="text-xs font-medium uppercase tracking-wide text-[var(--text-muted)]">
                    {s.label}
                  </p>
                  <p className="mt-1 font-display text-lg font-semibold text-violet-700 dark:text-violet-300">
                    {s.value}
                  </p>
                </div>
              ))}
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              <Badge variant="warning">{data.pendingCount} pending</Badge>
              <Badge variant="danger">{data.flaggedCount} flagged</Badge>
              <Badge variant="success">{data.verifiedCount} verified</Badge>
            </div>
            {data.byMethod.length > 0 && (
              <div className="mt-6">
                <p className="mb-2 text-sm font-medium">By payment channel</p>
                <ul className="space-y-2">
                  {data.byMethod.map((m) => (
                    <li
                      key={m.method}
                      className="flex items-center justify-between rounded-lg border border-[var(--border-subtle)] px-3 py-2 text-sm"
                    >
                      <span>{m.method}</span>
                      <span className="font-medium">
                        {fmt(m.amountRwf)} · {m.count} txn
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </>
        )}
      </Card>
    </section>
  );
}
