/** Receptionist operational workflow — Net Luna Villa / Orkestra */

export interface ReceptionistWorkflowStep {
  id: string;
  step: number;
  title: string;
  icon: string;
  summary: string;
  path: string;
  hash?: string;
  actions: string[];
}

export const RECEPTIONIST_WORKFLOW_INTRO =
  "After login, reception views bookings, verifies reservations, assigns rooms, checks guests in and out, handles service requests, generates bills, and updates room status — all logged in the system.";

export const RECEPTIONIST_WORKFLOW_STEPS: ReceptionistWorkflowStep[] = [
  {
    id: "login",
    step: 1,
    title: "Login",
    icon: "LogIn",
    summary: "Sign in with reception credentials to open the front desk dashboard.",
    path: "/login",
    actions: [
      "Enter receptionist email and password",
      "System verifies credentials",
      "Land on front desk dashboard with today's arrivals",
    ],
  },
  {
    id: "bookings",
    step: 2,
    title: "View bookings",
    icon: "CalendarCheck",
    summary: "Browse all reservations — pending, confirmed, checked-in, and cancelled.",
    path: "/reservations",
    hash: "bookings",
    actions: [
      "Open Reservations from sidebar or dashboard",
      "Filter by status: All, Confirmed, Pending, Checked-in",
      "See guest name, room, dates, and amount",
      "Create walk-in or phone reservations",
    ],
  },
  {
    id: "verify",
    step: 3,
    title: "Verify guest reservation",
    icon: "ShieldCheck",
    summary: "Confirm booking details, payment status, and guest identity before arrival.",
    path: "/reservations",
    hash: "verify",
    actions: [
      "Locate booking by ID or guest name",
      "Confirm dates, room type, and guest count",
      "Verify payment or folio balance",
      "Mark pending reservations as verified → confirmed",
    ],
  },
  {
    id: "assign-room",
    step: 4,
    title: "Assign room",
    icon: "Bed",
    summary: "Allocate a specific room number for the guest's stay.",
    path: "/check-in-out",
    hash: "assign-room",
    actions: [
      "Select today's arrival from the list",
      "Check room availability for booking dates",
      "Enter room number (e.g. 301, 205)",
      "Room linked to booking before check-in",
    ],
  },
  {
    id: "check-in",
    step: 5,
    title: "Process check-in",
    icon: "DoorOpen",
    summary: "Verify ID, assign room, and mark guest as checked-in — room becomes occupied.",
    path: "/check-in-out",
    hash: "check-in",
    actions: [
      "Confirm guest identity (ID / passport checkbox)",
      "Enter assigned room number",
      "Complete check-in — status → checked-in",
      "Guest receives welcome notification",
    ],
  },
  {
    id: "guest-requests",
    step: 6,
    title: "Manage guest requests",
    icon: "ConciergeBell",
    summary: "Route housekeeping, room service, maintenance, and concierge tasks to staff.",
    path: "/services",
    hash: "task-queue",
    actions: [
      "Monitor guest service requests in Services",
      "Assign tasks to housekeeping or maintenance staff",
      "Track open → in progress → completed",
      "Respond via Communications when needed",
    ],
  },
  {
    id: "bills",
    step: 7,
    title: "Generate bills",
    icon: "Receipt",
    summary: "Create final invoice — room charges plus services before departure.",
    path: "/check-in-out",
    hash: "bills",
    actions: [
      "Select departing guest from today's departures",
      "Generate invoice — room + services total",
      "Download HTML invoice for guest",
      "Confirm balance paid via Payments module",
    ],
  },
  {
    id: "checkout",
    step: 8,
    title: "Process check-out",
    icon: "LogOut",
    summary: "Complete departure after bill settlement and release the guest record.",
    path: "/check-in-out",
    hash: "checkout-workflow",
    actions: [
      "Review final bill and payment status",
      "Process check-out on departure list",
      "Guest stay history saved automatically",
      "Send checkout confirmation notification",
    ],
  },
  {
    id: "room-status",
    step: 9,
    title: "Update room status",
    icon: "RefreshCw",
    summary: "After check-out the room is marked available for the next guest.",
    path: "/check-in-out",
    hash: "room-status",
    actions: [
      "Check-out automatically releases the room",
      "Room status: occupied → available in database",
      "Housekeeping notified for turnover",
      "Front desk log records room release",
    ],
  },
];

export function receptionistStepHref(step: ReceptionistWorkflowStep): string {
  return step.hash ? `${step.path}#${step.hash}` : step.path;
}
