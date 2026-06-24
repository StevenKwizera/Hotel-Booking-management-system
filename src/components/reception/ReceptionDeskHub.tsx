import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import { useAuth } from "@/context/AuthContext";
import { useBackendData } from "@/context/BackendDataContext";
import { api, type BookingApi } from "@/lib/api";
import { RECEPTIONIST_WORKFLOW_STEPS, receptionistStepHref } from "@/lib/receptionist-journey";

interface StepMetric {
  count?: number;
  badge?: "warning" | "success" | "info" | "default";
  badgeLabel?: string;
}

export function ReceptionDeskHub({ compact }: { compact?: boolean }) {
  const { apiConnected } = useAuth();
  const { bookings, services } = useBackendData();
  const [arrivals, setArrivals] = useState<BookingApi[]>([]);
  const [departures, setDepartures] = useState<BookingApi[]>([]);

  const loadOps = useCallback(async () => {
    if (!apiConnected) return;
    try {
      const [a, d] = await Promise.all([api.getTodayArrivals(), api.getTodayDepartures()]);
      setArrivals(a);
      setDepartures(d);
    } catch {
      setArrivals([]);
      setDepartures([]);
    }
  }, [apiConnected]);

  useEffect(() => {
    loadOps();
  }, [loadOps, bookings]);

  const metrics = useMemo(() => {
    const pending = bookings.filter((b) => b.status === "pending").length;
    const openServices = services.filter((s) => s.status !== "completed").length;
    const map: Record<string, StepMetric> = {
      login: { badge: apiConnected ? "success" : "warning", badgeLabel: apiConnected ? "Online" : "Offline" },
      bookings: { count: bookings.length, badge: "info", badgeLabel: `${bookings.length} total` },
      verify: {
        count: pending,
        badge: pending > 0 ? "warning" : "success",
        badgeLabel: pending > 0 ? `${pending} pending` : "Clear",
      },
      "assign-room": { count: arrivals.length, badge: "info", badgeLabel: `${arrivals.length} arrivals` },
      "check-in": { count: arrivals.length, badge: arrivals.length > 0 ? "warning" : "default", badgeLabel: `${arrivals.length} waiting` },
      "guest-requests": {
        count: openServices,
        badge: openServices > 0 ? "warning" : "success",
        badgeLabel: `${openServices} open`,
      },
      bills: { count: departures.length, badge: "info", badgeLabel: `${departures.length} departures` },
      checkout: { count: departures.length, badge: "info", badgeLabel: "See workflow" },
      "room-status": { badge: "success", badgeLabel: "Auto on checkout" },
    };
    return map;
  }, [apiConnected, arrivals.length, bookings, departures.length, services]);

  const steps = RECEPTIONIST_WORKFLOW_STEPS.filter((s) => s.id !== "login" || !compact);

  return (
    <section className="space-y-3">
      {!compact && (
        <div className="overflow-hidden rounded-2xl border border-teal-200/50 bg-gradient-to-br from-teal-950/90 via-slate-900 to-cyan-950/70 p-5 text-white dark:border-teal-500/30">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-teal-200/80">
            Front desk workflow
          </p>
          <h2 className="mt-1 font-display text-lg font-semibold sm:text-xl">
            Live operations — each step opens the working module
          </h2>
        </div>
      )}

      <div className={`grid gap-2 ${compact ? "sm:grid-cols-2 lg:grid-cols-4" : "sm:grid-cols-2 xl:grid-cols-3"}`}>
        {steps.map((step) => {
          const m = metrics[step.id] ?? {};
          const href = receptionistStepHref(step);
          return (
            <Card key={step.id} className="flex flex-col p-4">
              <div className="flex items-start gap-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-teal-500/12">
                  <Icon name={step.icon} className="h-4 w-4 text-teal-600 dark:text-teal-400" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-xs font-semibold text-teal-600 dark:text-teal-400">
                      Step {step.step}
                    </span>
                    {m.badge && m.badgeLabel && (
                      <Badge variant={m.badge}>{m.badgeLabel}</Badge>
                    )}
                  </div>
                  <p className="mt-0.5 font-medium text-[var(--text-primary)]">{step.title}</p>
                  {!compact && (
                    <p className="mt-1 line-clamp-2 text-xs text-[var(--text-muted)]">{step.summary}</p>
                  )}
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
