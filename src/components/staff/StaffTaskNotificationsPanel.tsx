import { Link } from "react-router-dom";
import { Card, CardHeader } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import { EmptyState } from "@/components/ui/EmptyState";
import { useBackendData } from "@/context/BackendDataContext";

export function StaffTaskNotificationsPanel() {
  const { notifications } = useBackendData();

  const taskAlerts = notifications.filter(
    (n) => n.category === "service" || n.title.toLowerCase().includes("task"),
  );
  const unread = taskAlerts.filter((n) => !n.read).length;

  return (
    <section id="notifications">
      <Card>
        <CardHeader
          title="Task notifications"
          subtitle="New service requests and assignments"
          action={
            unread > 0 ? (
              <Badge variant="warning">{unread} unread</Badge>
            ) : (
              <Badge variant="success">All read</Badge>
            )
          }
        />
        {taskAlerts.length === 0 ? (
          <EmptyState
            icon="Bell"
            title="No task alerts yet"
            description="When guests submit requests or you are assigned, alerts appear here."
          />
        ) : (
          <ul className="space-y-2">
            {taskAlerts.slice(0, 8).map((n) => (
              <li
                key={n.id}
                className={`rounded-lg border px-4 py-3 text-sm ${
                  !n.read
                    ? "border-sky-300/50 bg-sky-50/80 dark:border-sky-500/30 dark:bg-sky-950/25"
                    : "border-[var(--border-subtle)]"
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-medium">{n.title}</p>
                    <p className="text-[var(--text-secondary)]">{n.body}</p>
                    <p className="mt-1 text-xs text-[var(--text-muted)]">{n.time}</p>
                  </div>
                  {!n.read && <Badge variant="info">New</Badge>}
                </div>
              </li>
            ))}
          </ul>
        )}
        <Link to="/communications" className="mt-4 inline-block">
          <Button variant="outline" size="sm" icon={<Icon name="MessageSquare" className="h-4 w-4" />}>
            All messages
          </Button>
        </Link>
      </Card>
    </section>
  );
}
