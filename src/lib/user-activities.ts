import type { UserRole } from "@/types";

export interface ActivityCategory {
  title: string;
  activities: string[];
}

export interface RoleActivityProfile {
  role: UserRole;
  title: string;
  summary: string;
  categories: ActivityCategory[];
}

/** Official Orkestra user activity classification by role */
export const ROLE_ACTIVITY_PROFILES: RoleActivityProfile[] = [
  {
    role: "guest",
    title: "Guest Activities",
    summary: "Booking, payments, services, profile, and communications for hotel guests.",
    categories: [
      {
        title: "Reservation Activities",
        activities: [
          "Search available rooms",
          "View room details",
          "Make bookings",
          "Modify bookings",
          "Cancel bookings",
        ],
      },
      {
        title: "Payment Activities",
        activities: [
          "Make online payments",
          "View payment history",
          "Download receipts",
        ],
      },
      {
        title: "Service Activities",
        activities: [
          "Request room service",
          "Request housekeeping",
          "Request maintenance assistance",
        ],
      },
      {
        title: "Profile Activities",
        activities: [
          "Create account",
          "Update profile",
          "View booking history",
          "Manage preferences",
        ],
      },
      {
        title: "Communication Activities",
        activities: [
          "Receive notifications",
          "Receive booking confirmations",
          "Communicate with hotel staff",
        ],
      },
    ],
  },
  {
    role: "receptionist",
    title: "Receptionist Activities",
    summary: "Front desk operations: reservations, check-in/out, and guest communication.",
    categories: [
      {
        title: "Reservation Management",
        activities: [
          "Create bookings",
          "Update bookings",
          "Cancel bookings",
          "Verify reservations",
        ],
      },
      {
        title: "Check-in Management",
        activities: [
          "Register guests",
          "Verify guest identity",
          "Assign rooms",
          "Process check-ins",
        ],
      },
      {
        title: "Check-out Management",
        activities: [
          "Generate guest bills",
          "Verify payments",
          "Process check-outs",
          "Release rooms",
        ],
      },
      {
        title: "Guest Management",
        activities: [
          "View guest profiles",
          "Update guest information",
          "View guest history",
        ],
      },
      {
        title: "Communication Activities",
        activities: ["Send notifications", "Respond to guest inquiries"],
      },
    ],
  },
  {
    role: "staff",
    title: "Hotel Staff Activities",
    summary: "Housekeeping, room service, and maintenance service delivery.",
    categories: [
      {
        title: "Service Management",
        activities: [
          "View service requests",
          "Accept assigned tasks",
          "Update task status",
          "Complete service requests",
        ],
      },
      {
        title: "Housekeeping Activities",
        activities: ["Clean rooms", "Update room status", "Report room conditions"],
      },
      {
        title: "Maintenance Activities",
        activities: [
          "Receive maintenance requests",
          "Perform repairs",
          "Record maintenance actions",
        ],
      },
      {
        title: "Room Service Activities",
        activities: [
          "Deliver requested services",
          "Update service completion records",
        ],
      },
    ],
  },
  {
    role: "finance",
    title: "Finance Officer Activities",
    summary: "Payments, billing, financial reporting, and audit verification.",
    categories: [
      {
        title: "Payment Management",
        activities: ["Verify payments", "Process refunds", "Monitor transactions"],
      },
      {
        title: "Billing Activities",
        activities: [
          "Review invoices",
          "Manage financial records",
          "Validate payment confirmations",
        ],
      },
      {
        title: "Financial Reporting",
        activities: [
          "Generate revenue reports",
          "Generate payment reports",
          "Monitor hotel income",
        ],
      },
      {
        title: "Audit Activities",
        activities: ["Review financial transactions", "Verify payment accuracy"],
      },
    ],
  },
  {
    role: "management",
    title: "Hotel Manager Activities",
    summary: "Operations monitoring, strategic decisions, reporting, and staff oversight.",
    categories: [
      {
        title: "Operational Monitoring",
        activities: [
          "Monitor hotel operations",
          "Monitor room occupancy",
          "Monitor service performance",
        ],
      },
      {
        title: "Decision-Making Activities",
        activities: [
          "Analyze hotel performance",
          "Review KPIs",
          "Make strategic decisions",
        ],
      },
      {
        title: "Reporting Activities",
        activities: ["View dashboards", "Generate reports", "Analyze trends"],
      },
      {
        title: "Staff Oversight",
        activities: ["Monitor staff performance", "Review service quality"],
      },
      {
        title: "Branch Management",
        activities: ["Monitor multiple branches", "Compare branch performance"],
      },
    ],
  },
  {
    role: "admin",
    title: "System Administrator Activities",
    summary: "Full system control: users, roles, configuration, security, and recovery.",
    categories: [
      {
        title: "User Management",
        activities: ["Create users", "Update users", "Delete users", "Reset passwords"],
      },
      {
        title: "Role Management",
        activities: [
          "Assign roles",
          "Manage permissions",
          "Control access rights",
        ],
      },
      {
        title: "Room & Service Configuration",
        activities: [
          "Add rooms",
          "Update room information",
          "Configure hotel services",
        ],
      },
      {
        title: "Security Management",
        activities: [
          "Monitor login activities",
          "Review audit logs",
          "Configure authentication",
          "Enable OTP settings",
        ],
      },
      {
        title: "System Configuration",
        activities: [
          "Configure system settings",
          "Manage payment integrations",
          "Manage communication settings",
        ],
      },
      {
        title: "Backup & Recovery",
        activities: ["Backup database", "Restore data", "Manage system recovery"],
      },
      {
        title: "Monitoring Activities",
        activities: ["Monitor system performance", "Resolve system issues"],
      },
    ],
  },
];

export function getActivitiesForRole(role: UserRole): RoleActivityProfile | undefined {
  return ROLE_ACTIVITY_PROFILES.find((p) => p.role === role);
}

export function countActivitiesForRole(role: UserRole): number {
  const profile = getActivitiesForRole(role);
  if (!profile) return 0;
  return profile.categories.reduce((sum, c) => sum + c.activities.length, 0);
}

export const TOTAL_CLASSIFIED_ACTIVITIES = ROLE_ACTIVITY_PROFILES.reduce(
  (sum, p) => sum + countActivitiesForRole(p.role),
  0,
);
