import { useMemo, useState } from "react";

import { Card, CardHeader } from "@/components/ui/Card";

import { Badge } from "@/components/ui/Badge";

import { Button } from "@/components/ui/Button";

import { EmptyState } from "@/components/ui/EmptyState";

import { useAppActions } from "@/context/AppActionsContext";

import { useAuth } from "@/context/AuthContext";

import { useBackendData } from "@/context/BackendDataContext";

import { consolidatedBranchMetrics } from "@/lib/page-helpers";

import { api, ApiError } from "@/lib/api";



const BRANCH_STATUSES = ["active", "maintenance", "offline"] as const;



export function MultiHotelPage() {

  const { showToast, navigateTo } = useAppActions();

  const { user } = useAuth();

  const { branches, loading, refresh } = useBackendData();

  const isAdmin = user?.role === "admin";

  const [updatingId, setUpdatingId] = useState<string | null>(null);



  const consolidated = useMemo(() => consolidatedBranchMetrics(branches), [branches]);



  const setBranchStatus = async (branchId: string, status: string) => {

    setUpdatingId(branchId);

    try {

      await api.updateBranch(branchId, { status });

      showToast(`Branch set to ${status}`, "success");

      await refresh();

    } catch (e) {

      showToast(e instanceof ApiError ? e.message : "Update failed", "error");

    } finally {

      setUpdatingId(null);

    }

  };



  return (

    <div className="space-y-6">

      <Card>

        <CardHeader

          title="Branch Overview"

          subtitle={

            isAdmin

              ? "Manage Net Luna Villa locations — set active, maintenance, or offline"

              : "Multi-hotel & scalability module — centralized control"

          }

        />

        {loading ? (

          <p className="py-8 text-center text-sm text-[var(--text-muted)]">Loading branches…</p>

        ) : branches.length === 0 ? (

          <EmptyState

            icon="Building2"

            title="No branches configured"

            description="Branch records load from the database when the API is running."

          />

        ) : (

          <div className="grid gap-4 md:grid-cols-3">

            {branches.map((b) => (

              <article

                key={b.id}

                className="rounded-xl border border-[var(--border-subtle)] p-4 transition-all hover:border-[var(--accent)]/30 hover:shadow-md"

              >

                <div className="flex items-start justify-between gap-2">

                  <h3 className="font-medium">{b.name}</h3>

                  <Badge

                    variant={

                      b.status === "active" ? "success" : b.status === "offline" ? "default" : "warning"

                    }

                  >

                    {b.status}

                  </Badge>

                </div>

                <div className="mt-4 grid grid-cols-2 gap-2 text-sm">

                  <div>

                    <p className="text-[var(--text-muted)]">Rooms</p>

                    <p className="font-semibold">{b.rooms}</p>

                  </div>

                  <div>

                    <p className="text-[var(--text-muted)]">Occupancy</p>

                    <p className="font-semibold">{b.occupancy}%</p>

                  </div>

                </div>

                <div className="mt-3 h-2 overflow-hidden rounded-full bg-[var(--bg-muted)]">

                  <div

                    className="h-full rounded-full bg-[var(--accent)] transition-all"

                    style={{ width: `${b.occupancy}%` }}

                  />

                </div>

                {isAdmin && (

                  <div className="mt-4 flex flex-wrap gap-1.5">

                    {BRANCH_STATUSES.map((status) => (

                      <Button

                        key={status}

                        size="sm"

                        variant={b.status === status ? "primary" : "outline"}

                        disabled={updatingId === b.id}

                        onClick={() => setBranchStatus(b.id, status)}

                      >

                        {status}

                      </Button>

                    ))}

                  </div>

                )}

              </article>

            ))}

          </div>

        )}

      </Card>



      <Card>

        <CardHeader

          title="Consolidated Metrics"

          subtitle="All branches — admin view"

          action={

            <Button

              variant="outline"

              size="sm"

              onClick={() => navigateTo("/reports", "Opening reports & analytics")}

            >

              Reports & analytics

            </Button>

          }

        />

        <div className="grid gap-4 sm:grid-cols-3">

          {[

            { label: "Total rooms", value: String(consolidated.totalRooms) },

            { label: "Avg. occupancy", value: `${consolidated.avgOccupancy}%` },

            { label: "Active branches", value: String(consolidated.branchCount) },

          ].map((m) => (

            <div

              key={m.label}

              className="rounded-lg bg-[var(--bg-muted)] p-4 text-center"

            >

              <p className="text-2xl font-semibold">{m.value}</p>

              <p className="text-sm text-[var(--text-muted)]">{m.label}</p>

            </div>

          ))}

        </div>

      </Card>

    </div>

  );

}


