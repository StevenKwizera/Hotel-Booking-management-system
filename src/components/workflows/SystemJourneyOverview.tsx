import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import { SYSTEM_INTRO, SYSTEM_JOURNEY_PHASES, JOURNEY_PHASE_PATHS } from "@/lib/system-journey";
import { ROLE_LABELS } from "@/lib/navigation";
import type { UserRole } from "@/types";

export function SystemJourneyOverview() {
  const navigate = useNavigate();
  const [expanded, setExpanded] = useState<string | null>(SYSTEM_JOURNEY_PHASES[0]?.id ?? null);

  return (
    <section className="space-y-6">
      <div className="overflow-hidden rounded-2xl border border-[var(--accent)]/20 bg-gradient-to-br from-[var(--sidebar-bg)] to-[var(--accent)]/30 p-6 text-white sm:p-8">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-white/65">
          How Orkestra works
        </p>
        <h2 className="mt-2 font-display text-2xl font-semibold sm:text-3xl">
          End-to-end hospitality journey
        </h2>
        <p className="mt-4 max-w-3xl text-sm leading-relaxed text-white/85 sm:text-base">
          {SYSTEM_INTRO}
        </p>
        <div className="mt-6 flex flex-wrap gap-2">
          {SYSTEM_JOURNEY_PHASES.map((p) => (
            <span
              key={p.id}
              className="rounded-full border border-white/20 bg-white/10 px-2.5 py-1 text-[10px] font-medium uppercase tracking-wide text-white/90"
            >
              {p.step}. {p.title}
            </span>
          ))}
        </div>
      </div>

      <div className="relative space-y-0">
        {SYSTEM_JOURNEY_PHASES.map((phase, index) => {
          const isOpen = expanded === phase.id;
          const isLast = index === SYSTEM_JOURNEY_PHASES.length - 1;

          return (
            <div key={phase.id} className="relative flex gap-4 sm:gap-6">
              {!isLast && (
                <div
                  className="absolute left-[19px] top-12 bottom-0 w-px bg-[var(--border-default)] sm:left-[23px]"
                  aria-hidden
                />
              )}

              <div className="relative z-10 flex h-10 w-10 shrink-0 items-center justify-center rounded-full border-2 border-[var(--accent)] bg-[var(--bg-surface)] font-display text-sm font-semibold text-[var(--accent)] sm:h-12 sm:w-12">
                {phase.step}
              </div>

              <Card className="mb-4 flex-1 overflow-hidden border-[var(--border-subtle)]">
                <button
                  type="button"
                  onClick={() => setExpanded(isOpen ? null : phase.id)}
                  className="flex w-full items-start gap-4 p-5 text-left transition hover:bg-[var(--bg-muted)]/50 sm:p-6"
                >
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[var(--accent)]/12">
                    <Icon name={phase.icon} className="h-5 w-5 text-[var(--accent)]" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-display text-lg font-semibold text-[var(--text-primary)]">
                      {phase.title}
                    </p>
                    <p className="mt-1 text-sm text-[var(--text-secondary)]">{phase.summary}</p>
                    <div className="mt-3 flex flex-wrap gap-1.5">
                      {phase.roles.map((role) => (
                        <RoleChip key={role} role={role} />
                      ))}
                    </div>
                  </div>
                  <Icon
                    name={isOpen ? "ChevronUp" : "ChevronDown"}
                    className="h-5 w-5 shrink-0 text-[var(--text-muted)]"
                  />
                </button>

                {isOpen && (
                  <div className="border-t border-[var(--border-subtle)] bg-[var(--bg-muted)]/40 px-5 pb-5 pt-4 sm:px-6">
                    <ol className="space-y-2">
                      {phase.steps.map((step, i) => (
                        <li
                          key={step}
                          className="flex items-start gap-3 text-sm text-[var(--text-secondary)]"
                        >
                          <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[var(--accent)]/15 text-[10px] font-semibold text-[var(--accent)]">
                            {i + 1}
                          </span>
                          {step}
                        </li>
                      ))}
                    </ol>
                    {JOURNEY_PHASE_PATHS[phase.id] && (
                      <Button
                        size="sm"
                        className="mt-4"
                        onClick={() => navigate(JOURNEY_PHASE_PATHS[phase.id])}
                      >
                        Open module
                      </Button>
                    )}
                  </div>
                )}
              </Card>
            </div>
          );
        })}
      </div>
    </section>
  );
}

function RoleChip({ role }: { role: UserRole }) {
  return (
    <span className="rounded-md bg-[var(--bg-surface)] px-2 py-0.5 text-[10px] font-medium text-[var(--text-muted)] ring-1 ring-[var(--border-subtle)]">
      {ROLE_LABELS[role]}
    </span>
  );
}
