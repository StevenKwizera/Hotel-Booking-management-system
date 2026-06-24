import type { ReportType } from "@/lib/report-generator";
import type { UserRole } from "@/types";

export interface ReportDefinition {
  id: ReportType;
  title: string;
  description: string;
  icon: string;
  roles: UserRole[];
}

export const REPORT_DEFINITIONS: ReportDefinition[] = [
  {
    id: "operations",
    title: "Full operations report",
    description: "Bookings, payments, occupancy & revenue summary in one document.",
    icon: "LayoutDashboard",
    roles: ["admin", "management", "receptionist"],
  },
  {
    id: "revenue",
    title: "Revenue summary",
    description: "Booking revenue, collections, and KPI totals for the period.",
    icon: "TrendingUp",
    roles: ["admin", "management", "finance", "receptionist"],
  },
  {
    id: "occupancy",
    title: "Occupancy & trends",
    description: "Daily occupancy percentages and revenue trend table.",
    icon: "BarChart3",
    roles: ["admin", "management", "finance", "receptionist", "staff"],
  },
  {
    id: "payments",
    title: "Payments & collections",
    description: "All transactions by method, status, and date.",
    icon: "CreditCard",
    roles: ["admin", "finance", "receptionist"],
  },
  {
    id: "bookings",
    title: "Reservations report",
    description: "Guest bookings, rooms, check-in/out, and amounts.",
    icon: "CalendarCheck",
    roles: ["admin", "management", "finance", "receptionist", "staff"],
  },
];

export function reportsForRole(role: UserRole): ReportDefinition[] {
  return REPORT_DEFINITIONS.filter((r) => r.roles.includes(role));
}

export function canAccessReports(role: UserRole): boolean {
  return reportsForRole(role).length > 0;
}
