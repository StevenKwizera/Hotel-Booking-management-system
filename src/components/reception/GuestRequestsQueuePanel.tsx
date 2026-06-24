import { Link } from "react-router-dom";
import { Card, CardHeader } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import { EmptyState } from "@/components/ui/EmptyState";
import { useBackendData } from "@/context/BackendDataContext";
import { useAppActions } from "@/context/AppActionsContext";
import { api } from "@/lib/api";

const TYPE_LABELS: Record<string, string> = {
  housekeeping: "Housekeeping",
  "room-service": "Room service",
  maintenance: "Maintenance",
  concierge: "Concierge",
};

export function GuestRequestsQueuePanel() {
  const { services, refresh } = useBackendData();
  const { showToast } = useAppActions();

  const open = services.filter((s) => s.status !== "completed");

  const assignStaff = async (code: string) => {
    try {
      await api.assignServiceStaff(code);
      showToast(`Task ${code} assigned to staff`, "success");
      await refresh();
    } catch (e) {
      showToast(e instanceof Error ? e.message : "Assign failed", "error");
    }
  };

  return (
    <section id="guest-requests">
      <Card>
        <CardHeader
          title="Guest service requests"
          subtitle="Assign and track open requests"
          action={
            open.length > 0 ? (
              <Badge variant="warning">{open.length} open</Badge>
            ) : (
              <Badge variant="success">Queue clear</Badge>
            )
          }
        />
        {open.length === 0 ? (
          <EmptyState
            icon="ConciergeBell"
            title="No open requests"
            description="Guest requests from room service, housekeeping, and maintenance appear here."
          />
        ) : (
          <ul className="space-y-2">
            {open.slice(0, 8).map((s) => (
              <li
                key={s.id}
                className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-[var(--border-subtle)] px-4 py-3 text-sm"
              >
                <div>
                  <p className="font-medium">
                    {s.id} · Room {s.room} · {TYPE_LABELS[s.type] ?? s.type}
                  </p>
                  <p className="text-[var(--text-muted)]">{s.description}</p>
                  <p className="mt-1 text-xs text-[var(--text-muted)]">
                    {s.status.replace("-", " ")}
                    {s.assignedStaff ? ` · ${s.assignedStaff}` : " · unassigned"}
                  </p>
                </div>
                {!s.assignedStaff && s.status === "open" && (
                  <Button size="sm" variant="outline" onClick={() => assignStaff(s.id)}>
                    Assign staff
                  </Button>
                )}
              </li>
            ))}
          </ul>
        )}
        <Link to="/services#task-queue" className="mt-4 inline-block">
          <Button size="sm" variant="outline" icon={<Icon name="ArrowRight" className="h-4 w-4" />}>
            Full service queue
          </Button>
        </Link>
      </Card>
    </section>
  );
}
