import { Link } from "react-router-dom";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import {
  GUEST_STAY_STEPS,
  computeStayStepState,
  guestStayStepHref,
  type StayProgressInput,
} from "@/lib/guest-stay-journey";

export function GuestStayHub({
  compact,
  progress,
}: {
  compact?: boolean;
  progress: StayProgressInput;
}) {
  const steps = GUEST_STAY_STEPS.filter((s) => s.roles.includes(progress.role));

  return (
    <section className="space-y-3">
      {!compact && (
        <div className="overflow-hidden rounded-2xl border border-sky-200/50 bg-gradient-to-br from-sky-950/90 via-slate-900 to-indigo-950/70 p-5 text-white dark:border-sky-500/30">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-sky-200/80">
            Guest stay workflow
          </p>
          <h2 className="mt-1 font-display text-lg font-semibold sm:text-xl">
            Arrival → check-in → services → AI → staff fulfillment
          </h2>
        </div>
      )}

      <div className={`grid gap-2 ${compact ? "sm:grid-cols-2 lg:grid-cols-4" : "sm:grid-cols-2 xl:grid-cols-4"}`}>
        {steps.map((step) => {
          const state = computeStayStepState(step.id, progress);
          const href = guestStayStepHref(step);
          return (
            <Card key={step.id} className="flex flex-col p-4">
              <div className="flex items-start gap-3">
                <div
                  className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${
                    state === "done"
                      ? "bg-emerald-500/12"
                      : state === "active"
                        ? "bg-sky-500/12"
                        : "bg-[var(--bg-muted)]"
                  }`}
                >
                  <Icon
                    name={state === "done" ? "CheckCircle2" : step.icon}
                    className={`h-4 w-4 ${
                      state === "done"
                        ? "text-emerald-600"
                        : state === "active"
                          ? "text-sky-600 dark:text-sky-400"
                          : "text-[var(--text-muted)]"
                    }`}
                  />
                </div>
                <div className="min-w-0 flex-1">
                  <span className="text-xs font-semibold text-sky-600 dark:text-sky-400">
                    Step {step.step}
                  </span>
                  <p className="mt-0.5 font-medium text-[var(--text-primary)]">{step.title}</p>
                  <Badge
                    variant={
                      state === "done" ? "success" : state === "active" ? "info" : "default"
                    }
                  >
                    {state === "done" ? "Done" : state === "active" ? "In progress" : "Pending"}
                  </Badge>
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
