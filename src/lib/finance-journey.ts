/** Finance Officer operational workflow — Net Luna Villa / Orkestra */

export interface FinanceWorkflowStep {
  id: string;
  step: number;
  title: string;
  icon: string;
  summary: string;
  path: string;
  hash?: string;
  actions: string[];
}

export const FINANCE_WORKFLOW_INTRO =
  "After login, the finance officer reviews every payment, verifies transactions against references, approves or flags items, exports financial reports, and monitors revenue across channels.";

export const FINANCE_WORKFLOW_STEPS: FinanceWorkflowStep[] = [
  {
    id: "login",
    step: 1,
    title: "Login",
    icon: "LogIn",
    summary: "Sign in with finance credentials; complete email OTP when required.",
    path: "/login",
    actions: [
      "Enter finance officer email and password",
      "Verify credentials against the database",
      "Complete OTP sent to your email",
      "Session opens with finance permissions",
    ],
  },
  {
    id: "all-payments",
    step: 2,
    title: "View all payments",
    icon: "CreditCard",
    summary: "Full ledger — Paypack MoMo and staff-recorded transactions.",
    path: "/payments",
    hash: "all-payments",
    actions: [
      "Open the payments module from dashboard or sidebar",
      "Browse all guest and front-desk transactions",
      "Filter by status: pending, completed, flagged, refunded",
      "See amount, method, date, and gateway reference",
    ],
  },
  {
    id: "verify",
    step: 3,
    title: "Verify transactions",
    icon: "CheckCircle2",
    summary: "Match each payment to its reference and mark as finance-verified.",
    path: "/payments",
    hash: "verify",
    actions: [
      "Compare amount with booking or folio balance",
      "Check Paypack reference codes",
      "Click Verify on each transaction reviewed",
      "Verified badge recorded in audit log",
    ],
  },
  {
    id: "approve-flag",
    step: 4,
    title: "Approve or flag payments",
    icon: "Shield",
    summary: "Approve pending payments to complete, or flag suspicious items for investigation.",
    path: "/payments",
    hash: "approve-flag",
    actions: [
      "Approve pending payments → status completed",
      "Flag duplicate or mismatched payments for review",
      "Process refunds on completed items when required",
      "Reconcile batch pending via Reconcile all",
    ],
  },
  {
    id: "reports",
    step: 5,
    title: "Generate financial reports",
    icon: "FileText",
    summary: "Export revenue, payment, and occupancy reports for accounting and leadership.",
    path: "/reports",
    hash: "reports",
    actions: [
      "Open Reports & analytics",
      "Select financial or operations report type",
      "Set date range and generate PDF preview",
      "Export JSON for accounting systems",
    ],
  },
  {
    id: "revenue",
    step: 6,
    title: "Monitor revenue",
    icon: "TrendingUp",
    summary: "Track today, week, and month collections by payment channel.",
    path: "/payments",
    hash: "revenue",
    actions: [
      "View today / week / month revenue totals",
      "Break down collections by Paypack MoMo",
      "Watch pending and flagged counts",
      "Compare against dashboard KPI trends",
    ],
  },
];

export function financeStepHref(step: FinanceWorkflowStep): string {
  return step.hash ? `${step.path}#${step.hash}` : step.path;
}
