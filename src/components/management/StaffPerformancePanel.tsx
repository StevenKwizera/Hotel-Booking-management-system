import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Card, CardHeader } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import { EmptyState } from "@/components/ui/EmptyState";
import { useAppActions } from "@/context/AppActionsContext";
import { api, ApiError, type StaffPerformanceApi } from "@/lib/api";

export function StaffPerformancePanel() {
  const { showToast } = useAppActions();
  const [rows, setRows] = useState<StaffPerformanceApi[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setRows(await api.getStaffPerformance());
    } catch (e) {
      showToast(e instanceof ApiError ? e.message : "Could not load staff metrics", "error");
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <section id="staff-performance">
      <Card>
        <CardHeader
          title="Staff performance"
          subtitle="Service assignments and completion rates — manager view"
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
          <p className="py-8 text-center text-sm text-[var(--text-muted)]">Loading staff metrics…</p>
        ) : rows.length === 0 ? (
          <EmptyState
            icon="Users"
            title="No service data yet"
            description="Staff metrics appear when service requests exist in the database."
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[520px] text-left text-sm">
              <thead>
                <tr className="border-b border-[var(--border-subtle)] text-xs text-[var(--text-muted)]">
                  <th className="pb-2 pr-4 font-medium">Staff</th>
                  <th className="pb-2 pr-4 font-medium">Assigned</th>
                  <th className="pb-2 pr-4 font-medium">Completed</th>
                  <th className="pb-2 pr-4 font-medium">In progress</th>
                  <th className="pb-2 pr-4 font-medium">Open</th>
                  <th className="pb-2 font-medium">Completion</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.staffName} className="border-b border-[var(--border-subtle)]/60">
                    <td className="py-3 pr-4 font-medium">{r.staffName}</td>
                    <td className="py-3 pr-4">{r.assigned}</td>
                    <td className="py-3 pr-4 text-emerald-600 dark:text-emerald-400">{r.completed}</td>
                    <td className="py-3 pr-4 text-amber-600 dark:text-amber-400">{r.inProgress}</td>
                    <td className="py-3 pr-4">{r.open}</td>
                    <td className="py-3">
                      <Badge
                        variant={
                          r.completionRatePct >= 80
                            ? "success"
                            : r.completionRatePct >= 50
                              ? "warning"
                              : "default"
                        }
                      >
                        {r.completionRatePct}%
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <p className="mt-4 text-xs text-[var(--text-muted)]">
          Open the{" "}
          <Link to="/services" className="font-medium text-[var(--accent)] hover:underline">
            service queue
          </Link>{" "}
          to assign tasks and update status.
        </p>
      </Card>
    </section>
  );
}
