import { useNavigate } from "react-router-dom";
import { Card, CardHeader } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";
import { TONE_STYLES, toneAt, type DashTone } from "@/lib/dashboard-theme";
import type { RoleDashboardApi } from "@/lib/api";

interface DashboardTaskListProps {
  tasks: RoleDashboardApi["tasks"];
  toneCycle: DashTone[];
  emptyTitle?: string;
}

export function DashboardTaskList({
  tasks,
  toneCycle,
  emptyTitle = "All caught up",
}: DashboardTaskListProps) {
  const navigate = useNavigate();

  return (
    <Card className="h-full">
      <CardHeader
        title="Live tasks"
        subtitle="Action items from your live data — select to open the module"
      />
      {tasks.length === 0 ? (
        <EmptyState icon="CheckCircle2" title={emptyTitle} description="No pending tasks right now." />
      ) : (
        <ul className="space-y-2">
          {tasks.map((t, i) => {
            const tone = toneAt(i, toneCycle);
            const s = TONE_STYLES[tone];
            return (
              <li
                key={t.id}
                className={`flex flex-wrap items-center justify-between gap-3 rounded-xl border p-4 transition hover:shadow-sm ${s.border} ${s.cardBg}`}
              >
                <div className="flex min-w-0 flex-1 items-start gap-3">
                  <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${s.iconBg}`}>
                    <Icon name={t.icon} className={`h-5 w-5 ${s.iconText}`} />
                  </div>
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-medium text-[var(--text-primary)]">{t.title}</p>
                      {t.priority === "high" && <Badge variant="warning">Priority</Badge>}
                    </div>
                    <p className="text-sm text-[var(--text-muted)]">{t.description}</p>
                  </div>
                </div>
                <Button size="sm" variant="outline" onClick={() => navigate(t.path)}>
                  {t.actionLabel}
                </Button>
              </li>
            );
          })}
        </ul>
      )}
    </Card>
  );
}
