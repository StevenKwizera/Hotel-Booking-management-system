import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Logo } from "@/components/brand/Logo";
import { Card, CardHeader } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Icon } from "@/components/ui/Icon";
import { SystemJourneyOverview } from "@/components/workflows/SystemJourneyOverview";
import { api, isApiAvailable, type WorkflowStatusResponse } from "@/lib/api";
import { ROLE_LABELS } from "@/lib/navigation";
import {
  ROLE_ACTIVITY_PROFILES,
  countActivitiesForRole,
  TOTAL_CLASSIFIED_ACTIVITIES,
} from "@/lib/user-activities";
import { SYSTEM_JOURNEY_PHASES } from "@/lib/system-journey";

const MODULES = [
  "Reservation & Booking",
  "Check-in / Check-out",
  "Guest Management",
  "AI Personalization",
  "Payment Integration (Paypack MoMo)",
  "Service & Operations",
  "Reporting & Analytics",
  "Communication",
  "Multi-Hotel Management",
  "Security & Access Control",
];

export function WorkflowsPage() {
  const [status, setStatus] = useState<WorkflowStatusResponse | null>(null);
  const [apiUp, setApiUp] = useState<boolean | null>(null);

  useEffect(() => {
    (async () => {
      const up = await isApiAvailable();
      setApiUp(up);
      if (up) {
        try {
          setStatus(await api.getWorkflowStatus());
        } catch {
          /* ignore */
        }
      }
    })();
  }, []);

  return (
    <div className="min-h-screen bg-[var(--bg-app)]">
      <header className="border-b border-[var(--border-subtle)] bg-[var(--bg-surface)] px-6 py-4">
        <div className="mx-auto flex max-w-6xl items-center justify-between">
          <Link to="/" className="inline-flex items-center gap-3">
            <Logo size={40} showWordmark />
          </Link>
          <div className="flex gap-3">
            <Link
              to="/login"
              className="text-sm font-medium text-[var(--text-secondary)] hover:text-[var(--accent)]"
            >
              Login
            </Link>
            <Link to="/register" className="text-sm font-medium text-[var(--accent)]">
              Guest sign up
            </Link>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-6 py-10">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="font-display text-3xl font-semibold sm:text-4xl">
              Orkestra System Design
            </h1>
            <p className="mt-2 max-w-2xl text-[var(--text-muted)]">
              Net Luna Villa Hotel · Adventist University of Central Africa (AUCA) — complete
              operational flow from login to check-out and platform administration.
            </p>
          </div>
          {apiUp !== null && (
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant={apiUp ? "success" : "warning"}>
                API {apiUp ? "online" : "offline"}
              </Badge>
              {status && <Badge variant="info">{status.modules} modules operational</Badge>}
              <Badge variant="default">{SYSTEM_JOURNEY_PHASES.length} journey phases</Badge>
            </div>
          )}
        </div>

        <div className="mt-10">
          <SystemJourneyOverview />
        </div>

        <section className="mt-14">
          <h2 className="font-display text-xl font-semibold">User roles & activities</h2>
          <p className="mt-1 text-sm text-[var(--text-muted)]">
            {TOTAL_CLASSIFIED_ACTIVITIES} classified activities across{" "}
            {ROLE_ACTIVITY_PROFILES.length} stakeholder roles
          </p>
          <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {ROLE_ACTIVITY_PROFILES.map((profile) => (
              <Card key={profile.role} className="p-4">
                <p className="font-medium">{ROLE_LABELS[profile.role]}</p>
                <p className="mt-1 line-clamp-2 text-sm text-[var(--text-muted)]">
                  {profile.summary}
                </p>
                <p className="mt-2 text-xs font-medium text-[var(--accent)]">
                  {profile.categories.length} categories ·{" "}
                  {countActivitiesForRole(profile.role)} activities
                </p>
              </Card>
            ))}
          </div>
        </section>

        <section className="mt-14">
          <h2 className="font-display text-xl font-semibold">System modules</h2>
          <ul className="mt-4 grid gap-2 sm:grid-cols-2">
            {MODULES.map((m, i) => (
              <li
                key={m}
                className="flex items-center gap-2 rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-surface)] px-3 py-2 text-sm"
              >
                <span className="flex h-6 w-6 items-center justify-center rounded bg-[var(--accent)]/15 text-xs font-bold text-[var(--accent)]">
                  {i + 1}
                </span>
                {m}
              </li>
            ))}
          </ul>
        </section>

        <section className="mt-14">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="font-display text-xl font-semibold">Technical workflow steps</h2>
            {apiUp === false && (
              <Badge variant="warning">Offline copy — start backend for live status</Badge>
            )}
            {apiUp === true && status && <Badge variant="success">Live from API</Badge>}
          </div>
          <p className="mt-1 text-sm text-[var(--text-muted)]">
            Module-level steps aligned with the journey above
          </p>
          <div className="mt-4 grid gap-4 lg:grid-cols-2">
            {status
              ? Object.entries(status.workflows).map(([key, flow]) => (
                  <Card key={key}>
                    <CardHeader
                      title={formatFlowName(key)}
                      subtitle={`Status: ${flow.status}`}
                      action={<Badge variant="success">Live</Badge>}
                    />
                    <ol className="list-decimal space-y-1 px-5 pb-5 pl-10 text-sm text-[var(--text-secondary)]">
                      {flow.steps.map((step) => (
                        <li key={step}>{step}</li>
                      ))}
                    </ol>
                  </Card>
                ))
              : FALLBACK_WORKFLOWS.map((w) => (
                  <Card key={w.id}>
                    <CardHeader title={w.title} />
                    <ol className="list-decimal space-y-1 px-5 pb-5 pl-10 text-sm text-[var(--text-secondary)]">
                      {w.steps.map((s) => (
                        <li key={s}>{s}</li>
                      ))}
                    </ol>
                  </Card>
                ))}
          </div>
        </section>

        <Card className="mt-14 p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
            <Icon name="Play" className="h-8 w-8 shrink-0 text-[var(--accent)]" />
            <div>
              <h3 className="font-display text-lg font-semibold">Experience the live system</h3>
              <p className="mt-2 text-sm leading-relaxed text-[var(--text-muted)]">
                Walk through the full journey: guest books and pays online → reception checks in
                → staff fulfill services → AI personalizes the stay → reception checks out →
                finance and management review reports → administrator secures the platform.
              </p>
              <div className="mt-4 flex flex-wrap gap-3">
                <Link
                  to="/login"
                  className="inline-flex items-center gap-2 rounded-lg bg-[var(--accent)] px-4 py-2 text-sm font-medium text-white hover:bg-[var(--accent-hover)]"
                >
                  <Icon name="LogIn" className="h-4 w-4" />
                  Sign in
                </Link>
                <Link
                  to="/register"
                  className="inline-flex items-center gap-2 rounded-lg border border-[var(--border-default)] px-4 py-2 text-sm font-medium text-[var(--text-primary)] hover:bg-[var(--bg-muted)]"
                >
                  Book as guest
                </Link>
              </div>
            </div>
          </div>
        </Card>
      </main>
    </div>
  );
}

function formatFlowName(key: string): string {
  return key
    .replace(/([A-Z])/g, " $1")
    .replace(/^./, (s) => s.toUpperCase())
    .trim();
}

const FALLBACK_WORKFLOWS = [
  {
    id: "security",
    title: "1. Authentication & access",
    steps: [
      "User logs in — credentials verified",
      "OTP emailed when required (Admin, Manager, Finance)",
      "Role-based dashboard redirect",
      "Actions logged to audit trail",
    ],
  },
  {
    id: "booking",
    title: "2. Booking & payment",
    steps: [
      "Guest searches rooms — live availability check",
      "Room selected, details captured, cost calculated",
      "Payment via Paypack MoMo",
      "Booking stored; confirmation sent",
    ],
  },
  {
    id: "checkin",
    title: "3. Check-in",
    steps: [
      "Receptionist verifies booking and identity",
      "Room assigned; status set to occupied",
      "Check-in recorded in database",
    ],
  },
  {
    id: "service",
    title: "4. Services during stay",
    steps: [
      "Guest submits housekeeping / room service / maintenance",
      "Staff assigned and executes task",
      "Status updated to completed",
    ],
  },
  {
    id: "ai",
    title: "5. AI personalization",
    steps: [
      "Guest data and preferences collected",
      "AI analyzes behavior continuously",
      "Recommendations delivered to guest",
    ],
  },
  {
    id: "checkout",
    title: "6. Check-out",
    steps: [
      "Final bill calculated (room + services)",
      "Payment verified; invoice generated",
      "Room released; guest history saved",
    ],
  },
  {
    id: "payment",
    title: "7. Finance oversight",
    steps: [
      "Payments monitored and verified",
      "Billing records maintained",
      "Revenue reports generated",
    ],
  },
  {
    id: "reporting",
    title: "8. Management analytics",
    steps: [
      "KPIs: occupancy, revenue, satisfaction, efficiency",
      "Dashboards and trends for decisions",
    ],
  },
];
