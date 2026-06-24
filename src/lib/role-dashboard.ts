import type { UserRole } from "@/types";

export interface DashboardTask {
  id: string;
  title: string;
  description: string;
  icon: string;
  actionLabel: string;
  /** navigate path, modal key, or special action */
  action: { type: "navigate"; path: string } | { type: "modal"; modal: string } | { type: "complete"; toast: string };
  priority?: "high" | "normal";
}

export interface RoleDashboardConfig {
  greeting: string;
  subtitle: string;
  kpis?: { label: string; value: string; icon: string }[];
  tasks: DashboardTask[];
  quickActions: { label: string; icon: string; path?: string; modal?: string }[];
}

export const ROLE_DASHBOARDS: Record<UserRole, RoleDashboardConfig> = {
  admin: {
    greeting: "System overview",
    subtitle: "Full platform control — Net Luna Villa & branches",
    kpis: [
      { label: "Branches online", value: "2/3", icon: "Building2" },
      { label: "Pending approvals", value: "3", icon: "Shield" },
      { label: "Active users", value: "29", icon: "Users" },
    ],
    tasks: [
      {
        id: "admin-approve-access",
        title: "Review pending access requests",
        description: "2 receptionist role changes awaiting approval",
        icon: "Shield",
        actionLabel: "Review access",
        action: { type: "navigate", path: "/security" },
      },
      {
        id: "admin-branch-alert",
        title: "Huye branch maintenance alert",
        description: "Occupancy dropped — review branch status",
        icon: "Building2",
        actionLabel: "Open multi-hotel",
        action: { type: "navigate", path: "/multi-hotel" },
      },
      {
        id: "admin-ai-review",
        title: "Review AI model performance",
        description: "3 new recommendation models deployed",
        icon: "Sparkles",
        actionLabel: "View AI module",
        action: { type: "navigate", path: "/ai-personalization" },
      },
      {
        id: "admin-audit",
        title: "Export weekly audit log",
        description: "Security compliance report due today",
        icon: "FileText",
        actionLabel: "Open reports",
        action: { type: "navigate", path: "/reports" },
      },
      {
        id: "admin-users",
        title: "Manage system users",
        description: "Create reception, finance, and staff accounts",
        icon: "UserCog",
        actionLabel: "User management",
        action: { type: "navigate", path: "/user-management" },
        priority: "high",
      },
    ],
    quickActions: [
      { label: "User management", icon: "UserCog", path: "/user-management" },
      { label: "Reports", icon: "FileText", path: "/reports" },
      { label: "All branches", icon: "Building2", path: "/multi-hotel" },
      { label: "Security", icon: "Shield", path: "/security" },
    ],
  },
  management: {
    greeting: "Executive dashboard",
    subtitle: "Strategic KPIs and operational insights",
    kpis: [
      { label: "RevPAR", value: "RWF 42K", icon: "TrendingUp" },
      { label: "Occupancy", value: "78%", icon: "Bed" },
      { label: "NPS", value: "72", icon: "Star" },
    ],
    tasks: [
      {
        id: "mgmt-satisfaction",
        title: "Review Q2 guest satisfaction report",
        description: "PDF ready — NPS up 4 points vs Q1",
        icon: "FileBarChart",
        actionLabel: "Open reports",
        action: { type: "navigate", path: "/reports" },
      },
      {
        id: "mgmt-revenue",
        title: "Approve weekly revenue summary",
        description: "RWF 18.2M total — generate from Reports center",
        icon: "CircleDollarSign",
        actionLabel: "Open reports",
        action: { type: "navigate", path: "/reports" },
        priority: "high",
      },
      {
        id: "mgmt-ai",
        title: "Review AI upsell recommendations",
        description: "28 guest personalization actions suggested",
        icon: "Sparkles",
        actionLabel: "View recommendations",
        action: { type: "navigate", path: "/ai-personalization" },
      },
      {
        id: "mgmt-export",
        title: "Export executive dashboard",
        description: "Board meeting materials — branded PDF",
        icon: "Download",
        actionLabel: "Generate report",
        action: { type: "navigate", path: "/reports" },
      },
    ],
    quickActions: [
      { label: "Reports", icon: "FileText", path: "/reports" },
      { label: "Reports & Analytics", icon: "BarChart3", path: "/reports" },
      { label: "Guest insights", icon: "Users", path: "/guests" },
      { label: "AI insights", icon: "Sparkles", path: "/ai-personalization" },
    ],
  },
  receptionist: {
    greeting: "Front desk operations",
    subtitle: "Today's arrivals, departures & bookings",
    kpis: [
      { label: "Arrivals today", value: "4", icon: "LogIn" },
      { label: "Departures", value: "3", icon: "LogOut" },
      { label: "Pending bookings", value: "6", icon: "Clock" },
    ],
    tasks: [
      {
        id: "recv-checkin-marie",
        title: "Express check-in: Marie Claire U.",
        description: "Deluxe 205 — expected 14:00",
        icon: "DoorOpen",
        actionLabel: "Start check-in",
        action: { type: "navigate", path: "/check-in-out" },
        priority: "high",
      },
      {
        id: "recv-confirm-bk",
        title: "Confirm booking BK-1040",
        description: "David K. M. — Standard 112, payment pending",
        icon: "CalendarCheck",
        actionLabel: "Open reservation",
        action: { type: "navigate", path: "/reservations" },
      },
      {
        id: "recv-departures",
        title: "Process 2 departures before noon",
        description: "Rooms 112 & 204 — folios ready",
        icon: "LogOut",
        actionLabel: "Check-out desk",
        action: { type: "navigate", path: "/check-in-out" },
      },
      {
        id: "recv-message",
        title: "Reply to guest message — Room 301",
        description: "Extra towels requested 2 min ago",
        icon: "MessageSquare",
        actionLabel: "Open inbox",
        action: { type: "navigate", path: "/communications" },
        priority: "high",
      },
    ],
    quickActions: [
      { label: "New reservation", icon: "Plus", modal: "new-reservation" },
      { label: "Check-in", icon: "DoorOpen", path: "/check-in-out" },
      { label: "Guests", icon: "Users", path: "/guests" },
      { label: "Reports", icon: "BarChart3", path: "/reports" },
    ],
  },
  staff: {
    greeting: "Operations board",
    subtitle: "Housekeeping, room service & maintenance",
    kpis: [
      { label: "Open requests", value: "5", icon: "ConciergeBell" },
      { label: "In progress", value: "2", icon: "Loader" },
      { label: "Completed today", value: "12", icon: "CheckCircle2" },
    ],
    tasks: [
      {
        id: "staff-housekeeping-205",
        title: "Housekeeping — Room 205",
        description: "Standard clean — medium priority",
        icon: "Sparkles",
        actionLabel: "Mark complete",
        action: { type: "complete", toast: "Room 205 housekeeping completed" },
        priority: "high",
      },
      {
        id: "staff-roomservice-301",
        title: "Room service — Room 301",
        description: "Breakfast tray — high priority, waiting 15 min",
        icon: "UtensilsCrossed",
        actionLabel: "Start delivery",
        action: { type: "navigate", path: "/services" },
        priority: "high",
      },
      {
        id: "staff-maintenance-112",
        title: "Maintenance — Room 112",
        description: "AC unit reported — guest checking out today",
        icon: "Wrench",
        actionLabel: "View request",
        action: { type: "navigate", path: "/services" },
      },
      {
        id: "staff-concierge",
        title: "Concierge — Airport pickup Room 302",
        description: "Completed — confirm with guest",
        icon: "Car",
        actionLabel: "Confirm done",
        action: { type: "complete", toast: "Concierge task confirmed with guest" },
      },
    ],
    quickActions: [
      { label: "New request", icon: "Plus", modal: "new-request" },
      { label: "All services", icon: "ConciergeBell", path: "/services" },
      { label: "Reports", icon: "BarChart3", path: "/reports" },
      { label: "Messages", icon: "MessageSquare", path: "/communications" },
    ],
  },
  finance: {
    greeting: "Finance desk",
    subtitle: "Payments, reconciliation & reporting",
    kpis: [
      { label: "Today's collections", value: "RWF 1.8M", icon: "Wallet" },
      { label: "Pending", value: "RWF 120K", icon: "Clock" },
      { label: "Paypack txns", value: "14", icon: "CreditCard" },
    ],
    tasks: [
      {
        id: "fin-process-8820",
        title: "Process payment PAY-8820",
        description: "Marie Claire U. — RWF 120,000 card payment pending",
        icon: "CreditCard",
        actionLabel: "Record payment",
        action: { type: "modal", modal: "record-payment" },
        priority: "high",
      },
      {
        id: "fin-paypack",
        title: "Reconcile Paypack batch",
        description: "Match Paypack MoMo references to ledger",
        icon: "RefreshCw",
        actionLabel: "Reconcile now",
        action: { type: "complete", toast: "Paypack batch reconciled — transactions matched" },
      },
      {
        id: "fin-export",
        title: "Export daily collection report",
        description: "Required for end-of-day closing",
        icon: "Download",
        actionLabel: "Open reports",
        action: { type: "navigate", path: "/reports" },
      },
      {
        id: "fin-refund",
        title: "Review refund request — BK-1039",
        description: "Grace A. T. — cancelled suite booking",
        icon: "RotateCcw",
        actionLabel: "Open payments",
        action: { type: "navigate", path: "/payments" },
      },
    ],
    quickActions: [
      { label: "Reports", icon: "FileText", path: "/reports" },
      { label: "Record payment", icon: "Plus", modal: "record-payment" },
      { label: "All transactions", icon: "CreditCard", path: "/payments" },
      { label: "Reports & Analytics", icon: "BarChart3", path: "/reports" },
    ],
  },
  guest: {
    greeting: "Welcome to Net Luna Villa",
    subtitle: "Book, pay, request services & personalized offers",
    kpis: [
      { label: "Your room", value: "Suite 301", icon: "Bed" },
      { label: "Check-out", value: "May 23", icon: "Calendar" },
      { label: "Balance", value: "RWF 120K", icon: "Wallet" },
    ],
    tasks: [
      {
        id: "guest-book-room",
        title: "Book a room online",
        description: "14 rooms available — Standard, Deluxe, or Suite",
        icon: "CalendarPlus",
        actionLabel: "Book now",
        action: { type: "navigate", path: "/reservations" },
        priority: "high",
      },
      {
        id: "guest-pay-balance",
        title: "Pay your outstanding balance",
        description: "Paypack MoMo",
        icon: "CreditCard",
        actionLabel: "Pay now",
        action: { type: "modal", modal: "guest-pay" },
        priority: "high",
      },
      {
        id: "guest-request-service",
        title: "Request hotel services",
        description: "Room service, housekeeping, maintenance, concierge",
        icon: "ConciergeBell",
        actionLabel: "New request",
        action: { type: "navigate", path: "/services" },
      },
      {
        id: "guest-ai-recs",
        title: "View personalized recommendations",
        description: "Spa, dining, late checkout & local tours",
        icon: "Sparkles",
        actionLabel: "See offers",
        action: { type: "navigate", path: "/ai-personalization" },
      },
      {
        id: "guest-alerts",
        title: "Check notifications & alerts",
        description: "Bookings, payments, services & checkout reminders",
        icon: "Bell",
        actionLabel: "View alerts",
        action: { type: "modal", modal: "notifications" },
      },
    ],
    quickActions: [
      { label: "Book room", icon: "CalendarPlus", path: "/reservations" },
      { label: "Pay bill", icon: "CreditCard", path: "/payments" },
      { label: "Services", icon: "ConciergeBell", path: "/services" },
      { label: "AI offers", icon: "Sparkles", path: "/ai-personalization" },
    ],
  },
};
