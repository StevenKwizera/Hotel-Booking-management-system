import { useCallback, useEffect, useState } from "react";
import { Card, CardHeader } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import { EmptyState } from "@/components/ui/EmptyState";
import { useAppActions } from "@/context/AppActionsContext";
import { api, ApiError, type AuditApi } from "@/lib/api";

export function ServiceRecordLogPanel() {
  const { showToast } = useAppActions();
  const [logs, setLogs] = useState<AuditApi[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setLogs(await api.getServiceLogs());
    } catch (e) {
      showToast(e instanceof ApiError ? e.message : "Could not load service records", "error");
      setLogs([]);
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <section id="service-log">
      <Card>
        <CardHeader
          title="Service records"
          subtitle="System audit trail — assignments, status updates, completions"
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
          <p className="py-8 text-center text-sm text-[var(--text-muted)]">Loading service records…</p>
        ) : logs.length === 0 ? (
          <EmptyState
            icon="ScrollText"
            title="No service records yet"
            description="Complete tasks above — each action is logged automatically."
          />
        ) : (
          <ul className="max-h-80 space-y-2 overflow-y-auto">
            {logs.map((log) => (
              <li
                key={`${log.user}-${log.action}-${log.time}`}
                className="rounded-lg border border-[var(--border-subtle)] px-4 py-3 text-sm"
              >
                <p className="font-medium">{log.action}</p>
                <p className="text-xs text-[var(--text-muted)]">
                  {log.user} · {log.time}
                </p>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </section>
  );
}
