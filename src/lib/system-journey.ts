import type { UserRole } from "@/types";

export interface JourneyPhase {
  id: string;
  step: number;
  title: string;
  icon: string;
  roles: UserRole[];
  summary: string;
  steps: string[];
}

/** Open the live module for each journey phase */
export const JOURNEY_PHASE_PATHS: Record<string, string> = {
  login: "/login",
  booking: "/reservations",
  checkin: "/check-in-out",
  services: "/services",
  ai: "/ai-personalization",
  checkout: "/check-in-out",
  finance: "/payments",
  management: "/reports",
  administration: "/user-management",
};

/** Official end-to-end Orkestra system journey — Net Luna Villa */
export const SYSTEM_INTRO =
  "Orkestra starts when any user (Guest, Receptionist, Staff, Finance Officer, Manager, or Administrator) logs in. The system verifies credentials, applies OTP when required, and redirects each user to the role-appropriate dashboard.";

export const SYSTEM_JOURNEY_PHASES: JourneyPhase[] = [
  {
    id: "login",
    step: 1,
    title: "Secure sign-in & role routing",
    icon: "Shield",
    roles: ["guest", "receptionist", "staff", "finance", "management", "admin"],
    summary:
      "Every user authenticates before accessing the platform. Admin, Manager, and Finance roles complete email OTP verification.",
    steps: [
      "User enters email and password",
      "System verifies credentials against the database",
      "OTP sent by email when required (Admin, Manager, Finance)",
      "User is redirected to the dashboard for their role",
      "Login and actions are recorded in the audit log",
    ],
  },
  {
    id: "booking",
    step: 2,
    title: "Guest booking & payment",
    icon: "CalendarCheck",
    roles: ["guest"],
    summary:
      "Guests search rooms with live availability, book online, pay securely, and receive confirmation.",
    steps: [
      "Guest logs in or registers",
      "Search available rooms by date and type",
      "System shows live room availability",
      "Guest selects a specific room",
      "Guest enters stay details (dates, guests)",
      "System calculates total price",
      "Payment via Paypack MoMo",
      "Booking confirmed in the database",
      "Confirmation sent by email and in-app notification",
    ],
  },
  {
    id: "checkin",
    step: 3,
    title: "Arrival & check-in",
    icon: "DoorOpen",
    roles: ["receptionist", "guest"],
    summary:
      "Reception verifies the reservation, assigns the room, and marks it occupied in the system.",
    steps: [
      "Guest arrives at hotel",
      "Receptionist verifies booking",
      "Room is assigned to the guest",
      "Guest checks in — room marked occupied",
    ],
  },
  {
    id: "services",
    step: 4,
    title: "Stay & hotel services",
    icon: "ConciergeBell",
    roles: ["guest", "staff", "receptionist"],
    summary:
      "Service requests flow from guest to staff with full tracking until completion.",
    steps: [
      "Guest uses hotel services during the stay",
      "AI suggests personalized services",
      "Guest requests room service or housekeeping",
      "Staff fulfills requests and marks complete",
    ],
  },
  {
    id: "ai",
    step: 5,
    title: "AI personalization",
    icon: "Sparkles",
    roles: ["guest", "management", "admin"],
    summary:
      "AI analyzes preferences and behavior to deliver tailored recommendations during the stay.",
    steps: [
      "System collects guest behavior, preferences, and history",
      "AI module analyzes patterns continuously",
      "Personalized recommendations generated (rooms, dining, services)",
      "Guest receives suggestions to improve the experience",
    ],
  },
  {
    id: "checkout",
    step: 6,
    title: "Check-out & departure",
    icon: "LogOut",
    roles: ["guest", "receptionist"],
    summary:
      "Final billing, payment verification, invoice, and room release with history saved.",
    steps: [
      "Guest requests check-out",
      "System calculates total bill",
      "Receptionist verifies charges",
      "Guest pays remaining balance",
      "Invoice generated",
      "Room marked as available",
      "Guest history saved",
    ],
  },
  {
    id: "finance",
    step: 7,
    title: "Finance & billing oversight",
    icon: "CircleDollarSign",
    roles: ["finance", "admin"],
    summary:
      "Finance monitors transactions, billing accuracy, and revenue reporting.",
    steps: [
      "Finance officer monitors all payments",
      "Transactions are verified",
      "Billing records are managed",
      "Financial reports track revenue and accuracy",
    ],
  },
  {
    id: "management",
    step: 8,
    title: "Management & analytics",
    icon: "BarChart3",
    roles: ["management", "admin"],
    summary:
      "Managers review KPIs and trends to guide operational decisions.",
    steps: [
      "Reporting and analytics dashboard accessed",
      "KPIs reviewed: occupancy, revenue, satisfaction, service efficiency",
      "Trends analyzed for informed decisions",
      "Multi-branch performance compared when applicable",
    ],
  },
  {
    id: "administration",
    step: 9,
    title: "Platform administration",
    icon: "Cog",
    roles: ["admin"],
    summary:
      "Administrators govern users, security, branches, integrations, and system health.",
    steps: [
      "Create and control user accounts",
      "Assign roles and permissions",
      "Configure system and payment integrations",
      "Manage hotel branches and services",
      "Monitor authentication and audit logs",
      "Perform backups and recovery for reliability",
    ],
  },
];
