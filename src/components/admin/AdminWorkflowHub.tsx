import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import { useAuth } from "@/context/AuthContext";
import { useBackendData } from "@/context/BackendDataContext";
import { api } from "@/lib/api";
import { ADMIN_WORKFLOW_STEPS, adminStepHref } from "@/lib/admin-journey";

export function AdminWorkflowHub({ compact }: { compact?: boolean }) {
  const { user } = useAuth();
  const { branches, auditLogs } = useBackendData();
  const [userCount, setUserCount] = useState(0);
  const [securityLogCount, setSecurityLogCount] = useState(0);
  const [backupCount, setBackupCount] = useState(0);

  useEffect(() => {
    (async () => {
      try {
        const [users, secLogs, backups] = await Promise.all([
          api.getUsers(),
          api.getSecurityLogs(),
          api.getBackupHistory(),
        ]);
        setUserCount(users.length);
        setSecurityLogCount(secLogs.length);
        setBackupCount(backups.length);
      } catch {
        /* offline */
      }
    })();
  }, []);

  const metrics: Record<string, { badge: "success" | "info" | "warning" | "default"; label: string }> = {
    login: { badge: user?.role === "admin" ? "success" : "default", label: user ? "Signed in" : "Sign in" },
    users: { badge: "info", label: `${userCount} accounts` },
    roles: { badge: "info", label: "6 roles" },
    settings: { badge: "default", label: "Configure" },
    "security-logs": { badge: securityLogCount > 0 ? "warning" : "default", label: `${securityLogCount} events` },
    branches: { badge: "info", label: `${branches.length} properties` },
    backup: { badge: backupCount > 0 ? "success" : "default", label: `${backupCount} snapshots` },
    "audit-reports": { badge: auditLogs.length > 0 ? "info" : "default", label: `${auditLogs.length} audit entries` },
  };

  const steps = ADMIN_WORKFLOW_STEPS.filter((s) => s.id !== "login" || user?.role !== "admin");

  return (
    <section className="space-y-3">
      {!compact && (
        <div className="overflow-hidden rounded-2xl border border-violet-200/50 bg-gradient-to-br from-violet-950/90 via-slate-900 to-sky-950/80 p-5 text-white dark:border-violet-500/30">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-violet-200/80">
            Administrator workflow
          </p>
          <h2 className="mt-1 font-display text-lg font-semibold sm:text-xl">
            Login → users → roles → settings → security → branches → backup → audit
          </h2>
        </div>
      )}

      <div className={`grid gap-2 ${compact ? "sm:grid-cols-2 lg:grid-cols-4" : "sm:grid-cols-2 xl:grid-cols-4"}`}>
        {steps.map((step) => {
          const m = metrics[step.id] ?? { badge: "default" as const, label: "Open" };
          const href = adminStepHref(step);
          return (
            <Card key={step.id} className="flex flex-col p-4">
              <div className="flex items-start gap-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-violet-500/12">
                  <Icon name={step.icon} className="h-4 w-4 text-violet-600 dark:text-violet-400" />
                </div>
                <div className="min-w-0 flex-1">
                  <span className="text-xs font-semibold text-violet-600 dark:text-violet-400">
                    Step {step.step}
                  </span>
                  <p className="mt-0.5 font-medium text-[var(--text-primary)]">{step.title}</p>
                  {!compact && (
                    <p className="mt-1 line-clamp-2 text-xs text-[var(--text-muted)]">{step.summary}</p>
                  )}
                  <div className="mt-1">
                    <Badge variant={m.badge}>{m.label}</Badge>
                  </div>
                </div>
              </div>
              <Link to={href} className="mt-3">
                <Button size="sm" variant="outline" className="w-full">
                  Open
                </Button>
              </Link>
            </Card>
          );
        })}
      </div>
    </section>
  );
}
