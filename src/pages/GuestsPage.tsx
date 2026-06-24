import { useState } from "react";
import { Card, CardHeader } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import { EmptyState } from "@/components/ui/EmptyState";
import { useAppActions } from "@/context/AppActionsContext";
import { useAuth } from "@/context/AuthContext";
import { useBackendData } from "@/context/BackendDataContext";
import type { Guest } from "@/types";

const tierColors = {
  standard: "default" as const,
  silver: "info" as const,
  gold: "warning" as const,
  platinum: "success" as const,
};

export function GuestsPage() {
  const { user } = useAuth();
  const { openModal } = useAppActions();
  const { guests, loading } = useBackendData();
  const [selected, setSelected] = useState<Guest | null>(null);

  const canManage =
    user?.role === "admin" || user?.role === "receptionist";
  const isViewOnly = user?.role === "management";

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-semibold text-[var(--text-primary)]">
            Guest directory
          </h1>
          <p className="mt-1 text-sm text-[var(--text-secondary)]">
            {isViewOnly
              ? "View registered guest profiles and stay history."
              : "Manage guest profiles, preferences, and visit history."}
          </p>
        </div>
        {canManage && (
          <div className="flex flex-wrap gap-2">
            <Button
              icon={<Icon name="UserPlus" className="h-4 w-4" />}
              onClick={() => openModal("new-guest")}
            >
              Add guest
            </Button>
          </div>
        )}
      </div>

      {loading ? (
        <p className="text-sm text-[var(--text-muted)]">Loading guest profiles…</p>
      ) : guests.length === 0 ? (
        <EmptyState
          icon="Users"
          title="No guests in database"
          description="Guest profiles appear after registration or when added at the front desk."
          action={
            canManage ? (
              <Button size="sm" onClick={() => openModal("new-guest")}>
                Add guest
              </Button>
            ) : undefined
          }
        />
      ) : (
        <div className="grid gap-6 xl:grid-cols-[1fr_340px]">
          <div className="grid gap-4 md:grid-cols-2">
            {guests.map((guest) => (
              <Card
                key={guest.id}
                className={`cursor-pointer transition-shadow hover:shadow-lg ${
                  selected?.id === guest.id
                    ? "ring-2 ring-[var(--accent)]/35"
                    : ""
                }`}
              >
                <button
                  type="button"
                  className="w-full text-left"
                  onClick={() => setSelected(guest)}
                >
                <div className="flex items-start justify-between">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[var(--accent)]/15 font-display text-lg font-semibold text-[var(--accent)]">
                    {guest.name
                      .split(" ")
                      .map((n) => n[0])
                      .slice(0, 2)
                      .join("")}
                  </div>
                  <Badge variant={tierColors[guest.tier]}>{guest.tier}</Badge>
                </div>
                <h3 className="mt-4 font-medium">{guest.name}</h3>
                <p className="text-sm text-[var(--text-muted)]">{guest.email}</p>
                <p className="mt-2 text-xs text-[var(--text-secondary)]">
                  {guest.visits} visit{guest.visits === 1 ? "" : "s"}
                </p>
                </button>
              </Card>
            ))}
          </div>

          <Card className="h-fit xl:sticky xl:top-24">
            {selected ? (
              <>
                <CardHeader
                  title={selected.name}
                  subtitle={`Guest ID · ${selected.id}`}
                />
                <dl className="space-y-4 text-sm">
                  <div>
                    <dt className="text-xs font-medium uppercase tracking-wider text-[var(--text-muted)]">
                      Email
                    </dt>
                    <dd className="mt-1 text-[var(--text-primary)]">{selected.email}</dd>
                  </div>
                  <div>
                    <dt className="text-xs font-medium uppercase tracking-wider text-[var(--text-muted)]">
                      Phone
                    </dt>
                    <dd className="mt-1 text-[var(--text-primary)]">
                      {selected.phone || "—"}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-xs font-medium uppercase tracking-wider text-[var(--text-muted)]">
                      Loyalty tier
                    </dt>
                    <dd className="mt-1 capitalize">{selected.tier}</dd>
                  </div>
                  <div>
                    <dt className="text-xs font-medium uppercase tracking-wider text-[var(--text-muted)]">
                      Total visits
                    </dt>
                    <dd className="mt-1">{selected.visits}</dd>
                  </div>
                  <div>
                    <dt className="text-xs font-medium uppercase tracking-wider text-[var(--text-muted)]">
                      Preferences
                    </dt>
                    <dd className="mt-2 flex flex-wrap gap-1.5">
                      {selected.preferences.length > 0 ? (
                        selected.preferences.map((p) => (
                          <span
                            key={p}
                            className="rounded-full bg-[var(--bg-muted)] px-2.5 py-1 text-xs text-[var(--text-secondary)]"
                          >
                            {p}
                          </span>
                        ))
                      ) : (
                        <span className="text-[var(--text-muted)]">None recorded</span>
                      )}
                    </dd>
                  </div>
                </dl>
                {canManage && (
                  <Button
                    variant="outline"
                    className="mt-6 w-full"
                    onClick={() => openModal("guest-profile")}
                  >
                    Edit preferences
                  </Button>
                )}
              </>
            ) : (
              <div className="py-8 text-center text-sm text-[var(--text-muted)]">
                <Icon name="Users" className="mx-auto mb-3 h-8 w-8 opacity-40" />
                Select a guest card to view full profile details
              </div>
            )}
          </Card>
        </div>
      )}
    </div>
  );
}
