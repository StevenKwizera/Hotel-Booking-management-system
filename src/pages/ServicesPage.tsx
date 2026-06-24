import { useMemo, useState } from "react";

import { Card, CardHeader } from "@/components/ui/Card";

import { Badge } from "@/components/ui/Badge";

import { Button } from "@/components/ui/Button";

import { Icon } from "@/components/ui/Icon";

import { FilterChip } from "@/components/ui/FilterChip";

import { useAppActions } from "@/context/AppActionsContext";

import { useAuth } from "@/context/AuthContext";

import { useGuestData } from "@/context/GuestDataContext";

import { useBackendData } from "@/context/BackendDataContext";
import { EmptyState } from "@/components/ui/EmptyState";
import { StaffPerformancePanel } from "@/components/management/StaffPerformancePanel";
import { StaffTaskNotificationsPanel } from "@/components/staff/StaffTaskNotificationsPanel";
import { ServiceRecordLogPanel } from "@/components/staff/ServiceRecordLogPanel";
import { SERVICE_TYPE_LABELS } from "@/lib/staff-journey";
import { useHashScroll } from "@/hooks/useHashScroll";
import { api } from "@/lib/api";
import type { GuestServiceRequest, ServiceRequest } from "@/types";



const TYPES = ["all", "housekeeping", "room-service", "maintenance", "concierge"] as const;

const GUEST_TYPES: GuestServiceRequest["type"][] = [

  "room-service",

  "housekeeping",

  "maintenance",

  "concierge",

];



export function ServicesPage() {

  const { user } = useAuth();

  const { openModal, showToast } = useAppActions();

  const guest = useGuestData();
  const backend = useBackendData();

  const isGuest = user?.role === "guest";
  const isStaff = user?.role === "staff";
  const canViewStaffMetrics = user?.role === "management" || user?.role === "admin";
  useHashScroll();

  const [filter, setFilter] = useState<(typeof TYPES)[number]>("all");



  const [reqType, setReqType] = useState<GuestServiceRequest["type"]>("room-service");

  const [room, setRoom] = useState(guest.room.replace(/\D/g, "") || "301");

  const [description, setDescription] = useState("");

  const [priority, setPriority] = useState<GuestServiceRequest["priority"]>("medium");



  const guestRequests = guest.serviceRequests;

  const requests = isGuest ? guestRequests : backend.services;

  const myTasks = useMemo(() => {
    if (!user?.name) return [];
    return requests.filter(
      (s) => s.assignedStaff === user.name && s.status !== "completed",
    );
  }, [requests, user?.name]);



  const filtered =

    filter === "all" ? requests : requests.filter((s) => s.type === filter);



  const completeRequest = async (id: string) => {
    try {
      await api.updateServiceStatus(id, "completed");
      await backend.refresh();
      showToast(`Request ${id} marked completed`, "success");
    } catch {
      showToast("Could not update service request in database", "error");
    }
  };

  const assignToMe = async (id: string) => {
    try {
      await api.assignServiceStaff(id, user?.name);
      await backend.refresh();
      showToast(`Assigned ${id} to you`, "success");
    } catch (e) {
      showToast(e instanceof Error ? e.message : "Assign failed", "error");
    }
  };

  const startRequest = async (id: string) => {
    try {
      await api.updateServiceStatus(id, "in-progress");
      await backend.refresh();
      showToast(`Started ${id}`, "success");
    } catch {
      showToast("Could not update status", "error");
    }
  };



  const iconFor = (type: ServiceRequest["type"]) => {

    const map = {

      housekeeping: "Sparkles",

      "room-service": "UtensilsCrossed",

      maintenance: "Wrench",

      concierge: "ConciergeBell",

    };

    return map[type];

  };



  const handleGuestSubmit = async (e: React.FormEvent) => {

    e.preventDefault();

    if (!description.trim()) {

      showToast("Add a description for your request", "warning");

      return;

    }

    try {

      const req = await guest.addServiceRequest({

        type: reqType,

        room,

        description: description.trim(),

        priority,

      });

      showToast(`Request ${req.id} submitted`, "success");

      setDescription("");

    } catch {

      showToast("Request failed — is the API running?", "error");

    }

  };



  const statusLabel = (status: ServiceRequest["status"]) => {

    if (status === "in-progress") return "In progress";

    return status.charAt(0).toUpperCase() + status.slice(1);

  };



  if (isGuest) {

    return (

      <div className="space-y-6">

        <section id="guest-request">
        <Card className="border-[var(--accent)]/25">

          <CardHeader

            title="Request hotel service"

            subtitle={`Room ${guest.room} — our team responds within minutes`}

          />

          <form onSubmit={handleGuestSubmit} className="grid gap-4 sm:grid-cols-2">

            <label className="block">

              <span className="text-sm text-[var(--text-secondary)]">Service type</span>

              <select

                value={reqType}

                onChange={(e) => setReqType(e.target.value as GuestServiceRequest["type"])}

                className="mt-1 w-full rounded-lg border border-[var(--border-default)] bg-[var(--bg-elevated)] px-3 py-2 text-sm capitalize outline-none focus:ring-2 focus:ring-[var(--accent)]/30"

              >

                {GUEST_TYPES.map((t) => (

                  <option key={t} value={t}>

                    {t.replace("-", " ")}

                  </option>

                ))}

              </select>

            </label>

            <label className="block">

              <span className="text-sm text-[var(--text-secondary)]">Room number</span>

              <input

                type="text"

                value={room}

                onChange={(e) => setRoom(e.target.value)}

                placeholder="301"

                className="mt-1 w-full rounded-lg border border-[var(--border-default)] bg-[var(--bg-elevated)] px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[var(--accent)]/30"

              />

            </label>

            <label className="block sm:col-span-2">

              <span className="text-sm text-[var(--text-secondary)]">Description</span>

              <textarea

                value={description}

                onChange={(e) => setDescription(e.target.value)}

                rows={3}

                placeholder="What do you need?"

                className="mt-1 w-full rounded-lg border border-[var(--border-default)] bg-[var(--bg-elevated)] px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[var(--accent)]/30"

              />

            </label>

            <label className="block">

              <span className="text-sm text-[var(--text-secondary)]">Priority</span>

              <select

                value={priority}

                onChange={(e) =>

                  setPriority(e.target.value as GuestServiceRequest["priority"])

                }

                className="mt-1 w-full rounded-lg border border-[var(--border-default)] bg-[var(--bg-elevated)] px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[var(--accent)]/30"

              >

                <option value="low">Low</option>

                <option value="medium">Medium</option>

                <option value="high">High</option>

              </select>

            </label>

            <div className="flex items-end">

              <Button type="submit" icon={<Icon name="Plus" className="h-4 w-4" />}>

                Submit request

              </Button>

            </div>

          </form>

        </Card>
        </section>



        <section id="my-services">
        <Card>

          <CardHeader title="My service requests" subtitle="Track status: open → in progress → completed" />

          <div className="space-y-3">

            {guestRequests.length === 0 ? (

              <p className="py-6 text-center text-sm text-[var(--text-muted)]">

                No requests yet.

              </p>

            ) : (

              guestRequests.map((s) => (

                <div

                  key={s.id}

                  className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-[var(--border-subtle)] p-4"

                >

                  <div className="flex items-center gap-3">

                    <Icon name={iconFor(s.type)} className="h-5 w-5 text-[var(--accent)]" />

                    <div>

                      <p className="font-medium capitalize">{s.type.replace("-", " ")}</p>

                      <p className="text-sm text-[var(--text-muted)]">

                        {s.id} · Room {s.room} · {s.createdAt}

                      </p>

                      <p className="mt-1 text-sm text-[var(--text-secondary)]">{s.description}</p>

                    </div>

                  </div>

                  <div className="flex flex-wrap items-center gap-2">

                    <Badge

                      variant={

                        s.priority === "high"

                          ? "danger"

                          : s.priority === "medium"

                            ? "warning"

                            : "default"

                      }

                    >

                      {s.priority}

                    </Badge>

                    <Badge

                      variant={

                        s.status === "completed"

                          ? "success"

                          : s.status === "in-progress"

                            ? "info"

                            : "warning"

                      }

                    >

                      {statusLabel(s.status)}

                    </Badge>

                    {s.status !== "completed" && (

                      <Button size="sm" onClick={() => guest.advanceServiceStatus(s.id)}>

                        {s.status === "open" ? "Mark in progress" : "Mark completed"}

                      </Button>

                    )}

                  </div>

                </div>

              ))

            )}

          </div>

        </Card>
        </section>

      </div>

    );

  }



  return (

    <div className="space-y-6">

      {isStaff && <StaffTaskNotificationsPanel />}

      {isStaff && (
        <section id="my-tasks">
          <Card>
            <CardHeader
              title="My assigned tasks"
              subtitle={`${myTasks.length} active task(s) assigned to you`}
            />
            {myTasks.length === 0 ? (
              <p className="py-6 text-center text-sm text-[var(--text-muted)]">
                No tasks assigned yet — claim one from the queue below.
              </p>
            ) : (
              <div className="space-y-3">
                {myTasks.map((s) => (
                  <StaffTaskRow
                    key={s.id}
                    s={s}
                    iconFor={iconFor}
                    onAssign={assignToMe}
                    onStart={startRequest}
                    onComplete={completeRequest}
                    showAssign={false}
                  />
                ))}
              </div>
            )}
          </Card>
        </section>
      )}

      {canViewStaffMetrics && <StaffPerformancePanel />}

      <div className="flex flex-wrap gap-2">

        {TYPES.map((type) => (

          <FilterChip

            key={type}

            label={type === "all" ? "All" : type.replace("-", " ")}

            active={filter === type}

            onClick={() => setFilter(type)}

          />

        ))}

        <Button

          icon={<Icon name="Plus" className="h-4 w-4" />}

          onClick={() => openModal("new-request")}

        >

          New Request

        </Button>

      </div>



      <section id="task-queue">
      <Card>

        <CardHeader
          title={isStaff ? "Operations queue" : "Operations Queue"}
          subtitle={
            isStaff
              ? "Perform service → Start → Complete — cleaning, repair & delivery"
              : "Service & operations module"
          }
        />

        <div className="space-y-3">

          {filtered.length === 0 ? (
            <EmptyState
              icon="ConciergeBell"
              title="Queue is empty"
              description={
                filter === "all"
                  ? "No open service requests — guests can submit from their portal."
                  : `No ${filter.replace("-", " ")} requests match this filter.`
              }
              action={
                <Button size="sm" onClick={() => openModal("new-request")}>
                  New request
                </Button>
              }
            />
          ) : (
          filtered.map((s) => (
            <StaffTaskRow
              key={s.id}
              s={s}
              iconFor={iconFor}
              onAssign={assignToMe}
              onStart={startRequest}
              onComplete={completeRequest}
              showAssign={!s.assignedStaff}
            />
          ))
          )}

        </div>

      </Card>
      </section>

      {(isStaff || canViewStaffMetrics) && <ServiceRecordLogPanel />}

    </div>

  );

}



function StaffTaskRow({
  s,
  iconFor,
  onAssign,
  onStart,
  onComplete,
  showAssign,
}: {
  s: ServiceRequest;
  iconFor: (type: ServiceRequest["type"]) => string;
  onAssign: (id: string) => void;
  onStart: (id: string) => void;
  onComplete: (id: string) => void;
  showAssign: boolean;
}) {
  const workLabel = SERVICE_TYPE_LABELS[s.type] ?? s.type.replace("-", " ");

  return (
            <div
              className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-[var(--border-subtle)] p-4"
            >
              <div className="flex items-center gap-3">
                <Icon name={iconFor(s.type)} className="h-5 w-5 text-[var(--accent)]" />
                <div>
                  <p className="font-medium capitalize">
                    {s.type.replace("-", " ")}{" "}
                    <span className="text-xs font-normal text-[var(--text-muted)]">
                      ({workLabel})
                    </span>
                  </p>
                  <p className="text-sm text-[var(--text-muted)]">
                    {s.id} · Room {s.room} · {s.createdAt}
                    {s.assignedStaff ? ` · ${s.assignedStaff}` : " · Unassigned"}
                  </p>
                  {s.description && (
                    <p className="mt-1 text-sm text-[var(--text-secondary)]">{s.description}</p>
                  )}
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <Badge
                  variant={
                    s.priority === "high"
                      ? "danger"
                      : s.priority === "medium"
                        ? "warning"
                        : "default"
                  }
                >
                  {s.priority}
                </Badge>
                <Badge
                  variant={
                    s.status === "completed"
                      ? "success"
                      : s.status === "in-progress"
                        ? "info"
                        : "warning"
                  }
                >
                  {s.status}
                </Badge>
                {s.status !== "completed" && (
                  <>
                    {showAssign && (
                      <Button size="sm" variant="outline" onClick={() => onAssign(s.id)}>
                        Assign to me
                      </Button>
                    )}
                    {s.status === "open" && (
                      <Button size="sm" variant="outline" onClick={() => onStart(s.id)}>
                        Start
                      </Button>
                    )}
                    <Button size="sm" onClick={() => onComplete(s.id)}>
                      Complete
                    </Button>
                  </>
                )}
              </div>
            </div>
  );
}

