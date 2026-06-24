import { useCallback, useEffect, useState } from "react";
import { Card, CardHeader } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import { EmptyState } from "@/components/ui/EmptyState";
import { useAppActions } from "@/context/AppActionsContext";
import { api, ApiError, type AuditApi } from "@/lib/api";

export function FrontDeskLogPanel() {
  const { showToast } = useAppActions();
  const [logs, setLogs] = useState<AuditApi[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setLogs(await api.getReceptionLogs());
    } catch (e) {
      showToast(e instanceof ApiError ? e.message : "Could not load front desk log", "error");
      setLogs([]);
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <section id="room-status">
      <Card>
        <CardHeader
          title="Front desk log"
          subtitle="Check-ins, check-outs, verifications & room status updates"
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
          <p className="py-8 text-center text-sm text-[var(--text-muted)]">Loading…</p>
        ) : logs.length === 0 ? (
          <EmptyState
            icon="ScrollText"
            title="No front desk records yet"
            description="Check-ins, verifications, and check-outs appear here automatically."
          />
        ) : (
          <ul className="max-h-80 space-y-2 overflow-y-auto">
            {logs.map((log) => (
              <li
                key={`${log.user}-${log.action}-${log.time}`}
                className="rounded-lg border border-teal-200/40 bg-teal-50/30 px-4 py-3 text-sm dark:border-teal-500/20 dark:bg-teal-950/20"
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
