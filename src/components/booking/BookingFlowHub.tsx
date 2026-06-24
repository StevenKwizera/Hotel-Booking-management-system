import { Link } from "react-router-dom";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import {
  BOOKING_FLOW_STEPS,
  bookingStepHref,
  computeBookingStepState,
  type BookingProgressInput,
} from "@/lib/booking-journey";

export function BookingFlowHub({
  compact,
  progress,
}: {
  compact?: boolean;
  progress: BookingProgressInput;
}) {
  const steps = BOOKING_FLOW_STEPS.filter((s) => s.id !== "login" || !progress.isLoggedIn);

  return (
    <section className="space-y-3">
      {!compact && (
        <div className="overflow-hidden rounded-2xl border border-sapphire-200/50 bg-gradient-to-br from-sapphire-950/90 via-slate-900 to-indigo-950/70 p-5 text-white dark:border-sapphire-500/30">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-sapphire-200/80">
            Booking workflow
          </p>
          <h2 className="mt-1 font-display text-lg font-semibold sm:text-xl">
            Search → select → pay → confirmed
          </h2>
        </div>
      )}

      <div className={`grid gap-2 ${compact ? "sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5" : "sm:grid-cols-2 xl:grid-cols-3"}`}>
        {steps.map((step) => {
          const state = computeBookingStepState(step.id, progress);
          const href = bookingStepHref(step);
          return (
            <Card key={step.id} className="flex flex-col p-3">
              <div className="flex items-start gap-2">
                <Icon
                  name={state === "done" ? "CheckCircle2" : step.icon}
                  className={`mt-0.5 h-4 w-4 shrink-0 ${
                    state === "done"
                      ? "text-emerald-600"
                      : state === "active"
                        ? "text-sapphire-600 dark:text-sapphire-400"
                        : "text-[var(--text-muted)]"
                  }`}
                />
                <div className="min-w-0 flex-1">
                  <span className="text-[10px] font-semibold text-sapphire-600 dark:text-sapphire-400">
                    {step.step}
                  </span>
                  <p className="line-clamp-2 text-xs font-medium">{step.title}</p>
                  <Badge
                    variant={
                      state === "done" ? "success" : state === "active" ? "info" : "default"
                    }
                  >
                    {state === "done" ? "Done" : state === "active" ? "Now" : "—"}
                  </Badge>
                </div>
              </div>
              {step.id !== "login" && (
                <Link to={href} className="mt-2">
                  <Button size="sm" variant="outline" className="w-full text-xs">
                    Go
                  </Button>
                </Link>
              )}
              {step.id === "login" && !progress.isLoggedIn && (
                <Link to="/login" className="mt-2">
                  <Button size="sm" className="w-full text-xs">
                    Sign in
                  </Button>
                </Link>
              )}
            </Card>
          );
        })}
      </div>
    </section>
  );
}
