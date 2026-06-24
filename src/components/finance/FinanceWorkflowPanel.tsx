import { useState } from "react";
import { Link } from "react-router-dom";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import {
  FINANCE_WORKFLOW_INTRO,
  FINANCE_WORKFLOW_STEPS,
  financeStepHref,
} from "@/lib/finance-journey";

export function FinanceWorkflowPanel({ compact }: { compact?: boolean }) {
  const [expanded, setExpanded] = useState<string | null>(
    compact ? null : FINANCE_WORKFLOW_STEPS[1]?.id ?? null,
  );

  return (
    <section className="space-y-4">
      {!compact && (
        <div className="overflow-hidden rounded-2xl border border-violet-200/50 bg-gradient-to-br from-violet-950/90 via-slate-900 to-indigo-950/80 p-6 text-white dark:border-violet-500/30 sm:p-7">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-violet-200/80">
            Finance workflow
          </p>
          <h2 className="mt-2 font-display text-xl font-semibold sm:text-2xl">
            Payments & revenue — step by step
          </h2>
          <p className="mt-3 max-w-3xl text-sm leading-relaxed text-white/85">{FINANCE_WORKFLOW_INTRO}</p>
        </div>
      )}

      <div className="relative space-y-0">
        {FINANCE_WORKFLOW_STEPS.map((step, index) => {
          const isOpen = expanded === step.id;
          const isLast = index === FINANCE_WORKFLOW_STEPS.length - 1;
          const href = financeStepHref(step);

          return (
            <div key={step.id} className="relative flex gap-3 sm:gap-5">
              {!isLast && (
                <div
                  className="absolute left-[17px] top-10 bottom-0 w-px bg-[var(--border-default)] sm:left-[21px]"
                  aria-hidden
                />
              )}

              <div className="relative z-10 flex h-9 w-9 shrink-0 items-center justify-center rounded-full border-2 border-violet-500/60 bg-[var(--bg-surface)] font-display text-xs font-semibold text-violet-600 dark:text-violet-300 sm:h-11 sm:w-11 sm:text-sm">
                {step.step}
              </div>

              <Card className={`mb-3 flex-1 overflow-hidden ${compact ? "mb-2" : "mb-4"}`}>
                <button
                  type="button"
                  onClick={() => setExpanded(isOpen ? null : step.id)}
                  className="flex w-full items-start gap-3 p-4 text-left transition hover:bg-[var(--bg-muted)]/50 sm:gap-4 sm:p-5"
                >
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-violet-500/12">
                    <Icon name={step.icon} className="h-5 w-5 text-violet-600 dark:text-violet-400" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-display font-semibold text-[var(--text-primary)]">{step.title}</p>
                    <p className="mt-0.5 text-sm text-[var(--text-secondary)]">{step.summary}</p>
                  </div>
                  <Icon
                    name={isOpen ? "ChevronUp" : "ChevronDown"}
                    className="h-5 w-5 shrink-0 text-[var(--text-muted)]"
                  />
                </button>

                {isOpen && (
                  <div className="border-t border-[var(--border-subtle)] bg-[var(--bg-muted)]/40 px-4 pb-4 pt-3 sm:px-5 sm:pb-5">
                    <ol className="space-y-2">
                      {step.actions.map((action, i) => (
                        <li
                          key={action}
                          className="flex items-start gap-3 text-sm text-[var(--text-secondary)]"
                        >
                          <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-violet-500/15 text-[10px] font-semibold text-violet-600 dark:text-violet-300">
                            {i + 1}
                          </span>
                          {action}
                        </li>
                      ))}
                    </ol>
                    <Link to={href} className="mt-4 inline-block">
                      <Button size="sm" icon={<Icon name="ArrowRight" className="h-4 w-4" />}>
                        Open {step.title.toLowerCase()}
                      </Button>
                    </Link>
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
