/** Hotel Manager operational workflow — Net Luna Villa / Orkestra */

export interface ManagementWorkflowStep {
  id: string;
  step: number;
  title: string;
  icon: string;
  summary: string;
  path: string;
  hash?: string;
  actions: string[];
}

export const MANAGEMENT_WORKFLOW_INTRO =
  "After login, the hotel manager monitors live KPIs, staff output, and reports — then acts on data-driven operational decisions for Net Luna Villa.";

export const MANAGEMENT_WORKFLOW_STEPS: ManagementWorkflowStep[] = [
  {
    id: "login",
    step: 1,
    title: "Login",
    icon: "LogIn",
    summary: "Sign in with manager credentials; complete email OTP when required.",
    path: "/login",
    actions: [
      "Enter management account email and password",
      "Verify credentials against the database",
      "Complete OTP sent to your email",
      "Session opens with manager permissions",
    ],
  },
  {
    id: "dashboard",
    step: 2,
    title: "Access dashboard",
    icon: "LayoutDashboard",
    summary: "Land on the executive dashboard with live tasks, alerts, and quick actions.",
    path: "/dashboard",
    actions: [
      "View greeting and property status badges",
      "See priority tasks from the live API",
      "Use quick links to reports, guests, and AI",
      "Navigate modules from the sidebar",
    ],
  },
  {
    id: "kpis",
    step: 3,
    title: "View KPIs",
    icon: "BarChart3",
    summary: "Occupancy, revenue, bookings, and performance metrics updated from the database.",
    path: "/dashboard",
    hash: "kpis",
    actions: [
      "Review occupancy rate and room availability",
      "Track revenue (today and trends)",
      "Monitor active and pending bookings",
      "Compare 7-day occupancy vs revenue chart",
    ],
  },
  {
    id: "staff",
    step: 4,
    title: "Monitor staff performance",
    icon: "Users",
    summary: "Service completion rates, assignments, and queue health by staff member.",
    path: "/services",
    hash: "staff-performance",
    actions: [
      "View tasks assigned per staff member",
      "Track open, in-progress, and completed requests",
      "Identify bottlenecks in housekeeping and maintenance",
      "Drill into the full service operations queue",
    ],
  },
  {
    id: "reports",
    step: 5,
    title: "Review reports",
    icon: "FileText",
    summary: "Formal analytics exports — occupancy, revenue, operations, and guest satisfaction.",
    path: "/reports",
    hash: "reports",
    actions: [
      "Open live KPI and trend charts",
      "Generate PDF-ready operational reports",
      "Set date range and export JSON",
      "Share weekly summary with leadership",
    ],
  },
  {
    id: "decisions",
    step: 6,
    title: "Make operational decisions",
    icon: "Lightbulb",
    summary: "Act on AI insights, pricing signals, and KPI alerts to improve hotel performance.",
    path: "/reports",
    hash: "decisions",
    actions: [
      "Review strategic recommendations from analytics",
      "Adjust staffing based on service peaks",
      "Apply dynamic pricing suggestions when occupancy shifts",
      "Follow up on underperforming areas",
    ],
  },
];

export function managementStepHref(step: ManagementWorkflowStep): string {
  return step.hash ? `${step.path}#${step.hash}` : step.path;
}
