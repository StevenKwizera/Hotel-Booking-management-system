import { Icon } from "@/components/ui/Icon";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import type { DashboardTask } from "@/lib/role-dashboard";

interface TaskCardProps {
  task: DashboardTask;
  done: boolean;
  onAction: () => void;
}

export function TaskCard({ task, done, onAction }: TaskCardProps) {
  return (
    <div
      className={`flex flex-col gap-4 rounded-xl border p-4 transition-all sm:flex-row sm:items-center sm:justify-between ${
        done
          ? "border-[var(--success)]/25 bg-[var(--success)]/5 opacity-75"
          : task.priority === "high"
            ? "border-[var(--accent)]/35 bg-[var(--accent)]/5 shadow-sm"
            : "border-[var(--border-subtle)] bg-[var(--bg-surface)]"
      }`}
    >
      <div className="flex gap-4">
        <div
          className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${
            done ? "bg-[var(--success)]/15" : "bg-[var(--accent)]/12"
          }`}
        >
          <Icon
            name={done ? "CheckCircle2" : task.icon}
            className={`h-5 w-5 ${done ? "text-[var(--success)]" : "text-[var(--accent)]"}`}
          />
        </div>
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h3
              className={`font-medium ${done ? "line-through text-[var(--text-muted)]" : "text-[var(--text-primary)]"}`}
            >
              {task.title}
            </h3>
            {task.priority === "high" && !done && (
              <Badge variant="warning">Priority</Badge>
            )}
            {done && <Badge variant="success">Done</Badge>}
          </div>
          <p className="mt-0.5 text-sm text-[var(--text-muted)]">{task.description}</p>
        </div>
      </div>
      {!done && (
        <Button size="sm" onClick={onAction} className="shrink-0 sm:min-w-[140px]">
          {task.actionLabel}
        </Button>
      )}
    </div>
  );
}
