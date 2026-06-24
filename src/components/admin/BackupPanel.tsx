import { useCallback, useEffect, useState } from "react";
import { Card, CardHeader } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import { Badge } from "@/components/ui/Badge";
import { useAppActions } from "@/context/AppActionsContext";
import { api, ApiError, type BackupRecordApi } from "@/lib/api";

function formatBytes(n: number) {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)} MB`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)} KB`;
  return `${n} B`;
}

export function BackupPanel() {
  const { showToast, exportData } = useAppActions();
  const [history, setHistory] = useState<BackupRecordApi[]>([]);
  const [loading, setLoading] = useState(true);
  const [running, setRunning] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setHistory(await api.getBackupHistory());
    } catch (e) {
      showToast(e instanceof ApiError ? e.message : "Could not load backups", "error");
      setHistory([]);
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    load();
  }, [load]);

  const runBackup = async () => {
    setRunning(true);
    try {
      const result = await api.runBackup();
      exportData(`orkestra-backup-${Date.now()}.json`, result.exportPayload);
      setHistory((prev) => [result.record, ...prev].slice(0, 10));
      showToast("Backup completed and downloaded", "success");
    } catch (e) {
      showToast(e instanceof ApiError ? e.message : "Backup failed", "error");
    } finally {
      setRunning(false);
    }
  };

  return (
    <section id="backup">
      <Card>
      <CardHeader
        title="Database backup"
        subtitle="Snapshot users, bookings, payments, branches, and audit logs"
        action={
          <Button
            size="sm"
            onClick={runBackup}
            loading={running}
            icon={<Icon name="Database" className="h-4 w-4" />}
          >
            Run backup
          </Button>
        }
      />
      {loading ? (
        <p className="py-6 text-center text-sm text-[var(--text-muted)]">Loading backup history…</p>
      ) : history.length === 0 ? (
        <p className="py-6 text-center text-sm text-[var(--text-muted)]">
          No backups yet — run your first snapshot above.
        </p>
      ) : (
        <ul className="space-y-2">
          {history.map((b) => (
            <li
              key={b.id}
              className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-[var(--border-subtle)] px-4 py-3 text-sm"
            >
              <div>
                <p className="font-medium">{b.label}</p>
                <p className="text-xs text-[var(--text-muted)]">
                  {b.createdBy} · {b.createdAt}
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="info">{formatBytes(b.sizeBytes)}</Badge>
                <Badge variant="default">
                  {b.userCount} users · {b.bookingCount} bookings
                </Badge>
              </div>
            </li>
          ))}
        </ul>
      )}
    </Card>
    </section>
  );
}
