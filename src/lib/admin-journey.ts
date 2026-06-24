/** Administrator operational workflow — Net Luna Villa / Orkestra */

export interface AdminWorkflowStep {
  id: string;
  step: number;
  title: string;
  icon: string;
  summary: string;
  path: string;
  hash?: string;
  actions: string[];
}

export const ADMIN_WORKFLOW_INTRO =
  "After login, the system administrator governs users, security, branches, and platform health. Each step below opens the live module where that work is performed.";

export const ADMIN_WORKFLOW_STEPS: AdminWorkflowStep[] = [
  {
    id: "login",
    step: 1,
    title: "Login",
    icon: "LogIn",
    summary: "Authenticate with email and password; OTP is sent for admin accounts when enabled.",
    path: "/login",
    actions: [
      "Enter administrator credentials",
      "System verifies against the database",
      "Complete email OTP when prompted",
      "Land on the admin dashboard",
    ],
  },
  {
    id: "users",
    step: 2,
    title: "Manage users",
    icon: "UserCog",
    summary: "Create, edit, enable/disable, reset passwords, and delete staff accounts.",
    path: "/user-management",
    actions: [
      "Create staff user (name, email, role, password)",
      "Edit account status and profile",
      "Reset password for locked-out users",
      "Delete accounts no longer needed",
    ],
  },
  {
    id: "roles",
    step: 3,
    title: "Assign roles & permissions",
    icon: "Shield",
    summary: "Map each user to a role; control what reception, finance, management, and staff can do.",
    path: "/security",
    hash: "roles",
    actions: [
      "Review role matrix (admin, management, receptionist, staff, finance, guest)",
      "Change user role from User Management",
      "Open classified activities per role",
      "Enforce least-privilege access",
    ],
  },
  {
    id: "settings",
    step: 4,
    title: "Configure system settings",
    icon: "Settings",
    summary: "Hotel identity, OTP policy, session timeout, and notification defaults.",
    path: "/security",
    hash: "settings",
    actions: [
      "Set hotel and branch display names",
      "Toggle OTP for admin / management / finance",
      "Adjust session timeout minutes",
      "Save — changes logged to audit trail",
    ],
  },
  {
    id: "security-logs",
    step: 5,
    title: "Monitor security logs",
    icon: "ScrollText",
    summary: "Watch sign-ins, failed attempts, OTP events, and privileged actions in real time.",
    path: "/security",
    hash: "security-logs",
    actions: [
      "Filter login and authentication events",
      "Review user management actions",
      "Export security log snapshot",
      "Investigate failed login attempts",
    ],
  },
  {
    id: "branches",
    step: 6,
    title: "Manage hotel branches",
    icon: "Building2",
    summary: "Net Luna Villa locations — status, occupancy, and consolidated metrics.",
    path: "/multi-hotel",
    actions: [
      "View Kigali, Musanze, and Huye branches",
      "Set branch active / maintenance / offline",
      "Compare occupancy across properties",
      "Open consolidated reports",
    ],
  },
  {
    id: "backup",
    step: 7,
    title: "Perform backups",
    icon: "Database",
    summary: "Snapshot operational data for recovery and compliance.",
    path: "/security",
    hash: "backup",
    actions: [
      "Run database backup (bookings, guests, payments, audit)",
      "Download backup JSON export",
      "View backup history with timestamps",
      "Restore planning via exported archive",
    ],
  },
  {
    id: "audit-reports",
    step: 8,
    title: "View audit reports",
    icon: "FileText",
    summary: "Full audit trail plus management KPIs and exportable compliance reports.",
    path: "/reports",
    hash: "audit",
    actions: [
      "Open reports & analytics dashboard",
      "Export occupancy and revenue charts",
      "Download audit log for compliance",
      "Share weekly security summary",
    ],
  },
];

export function adminStepHref(step: AdminWorkflowStep): string {
  return step.hash ? `${step.path}#${step.hash}` : step.path;
}
