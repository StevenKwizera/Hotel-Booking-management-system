/** Hotel Staff operational workflow — Net Luna Villa / Orkestra */

export interface StaffWorkflowStep {
  id: string;
  step: number;
  title: string;
  icon: string;
  summary: string;
  path: string;
  hash?: string;
  actions: string[];
}

export const STAFF_WORKFLOW_INTRO =
  "After login, staff receive service task alerts, view assigned requests, perform the work (cleaning, repair, delivery), update status, mark complete, and the system logs every step.";

export const STAFF_WORKFLOW_STEPS: StaffWorkflowStep[] = [
  {
    id: "login",
    step: 1,
    title: "Login",
    icon: "LogIn",
    summary: "Sign in with your staff account to open the operations board.",
    path: "/login",
    actions: [
      "Enter staff email and password",
      "System verifies credentials",
      "Land on your staff dashboard",
    ],
  },
  {
    id: "notifications",
    step: 2,
    title: "Receive task notification",
    icon: "Bell",
    summary: "New housekeeping, room service, maintenance, or concierge tasks alert you instantly.",
    path: "/services",
    hash: "notifications",
    actions: [
      "Bell icon shows unread service alerts",
      "Notification lists room, type, and priority",
      "Open Services from dashboard task or sidebar",
      "Communications page shows full message history",
    ],
  },
  {
    id: "my-tasks",
    step: 3,
    title: "View assigned request",
    icon: "ClipboardList",
    summary: "See tasks assigned to you — room number, guest need, and priority.",
    path: "/services",
    hash: "my-tasks",
    actions: [
      "My tasks section shows only your assignments",
      "Read description (cleaning, repair, delivery details)",
      "Claim unassigned tasks with Assign to me",
      "Filter queue by housekeeping, maintenance, room service",
    ],
  },
  {
    id: "perform",
    step: 4,
    title: "Perform service",
    icon: "Wrench",
    summary: "Execute the task — cleaning, repair, or room delivery at the guest room.",
    path: "/services",
    hash: "task-queue",
    actions: [
      "Housekeeping — clean room, turndown, linens",
      "Maintenance — repair AC, plumbing, fixtures",
      "Room service — deliver food, amenities, concierge runs",
      "Follow priority: high tasks first",
    ],
  },
  {
    id: "status",
    step: 5,
    title: "Update task status",
    icon: "RefreshCw",
    summary: "Move request from open → in progress when you begin work.",
    path: "/services",
    hash: "task-queue",
    actions: [
      "Tap Start when you begin the task",
      "Status updates to in progress in the database",
      "Guest receives a service update notification",
      "Manager sees live queue on dashboards",
    ],
  },
  {
    id: "complete",
    step: 6,
    title: "Mark task as completed",
    icon: "CheckCircle2",
    summary: "Finish the job and close the request in the system.",
    path: "/services",
    hash: "task-queue",
    actions: [
      "Tap Complete when work is done",
      "Request moves to completed status",
      "Guest notified that service is finished",
      "Your completion count updates for managers",
    ],
  },
  {
    id: "service-log",
    step: 7,
    title: "System logs service record",
    icon: "ScrollText",
    summary: "Every assign, status change, and completion is recorded in the audit trail.",
    path: "/services",
    hash: "service-log",
    actions: [
      "Audit log captures who did what and when",
      "Service record visible at bottom of Services page",
      "Managers review staff performance from logs",
      "Full history exportable for operations review",
    ],
  },
];

export function staffStepHref(step: StaffWorkflowStep): string {
  return step.hash ? `${step.path}#${step.hash}` : step.path;
}

export const SERVICE_TYPE_LABELS: Record<string, string> = {
  housekeeping: "Cleaning",
  maintenance: "Repair",
  "room-service": "Delivery",
  concierge: "Concierge",
};
