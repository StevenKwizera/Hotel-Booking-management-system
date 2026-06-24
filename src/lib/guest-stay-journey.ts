/** Guest stay workflow — arrival through staff fulfillment */

export interface GuestStayStep {
  id: string;
  step: number;
  title: string;
  icon: string;
  path: string;
  hash?: string;
  roles: ("guest" | "receptionist" | "staff")[];
}

export const GUEST_STAY_STEPS: GuestStayStep[] = [
  {
    id: "arrive",
    step: 1,
    title: "Guest arrives at hotel",
    icon: "MapPin",
    path: "/check-in-out",
    hash: "arrival",
    roles: ["guest", "receptionist"],
  },
  {
    id: "verify",
    step: 2,
    title: "Receptionist verifies booking",
    icon: "ShieldCheck",
    path: "/reservations",
    hash: "verify",
    roles: ["receptionist"],
  },
  {
    id: "assign",
    step: 3,
    title: "Room assigned",
    icon: "Bed",
    path: "/check-in-out",
    hash: "assign-room",
    roles: ["receptionist"],
  },
  {
    id: "checkin",
    step: 4,
    title: "Guest checks in",
    icon: "DoorOpen",
    path: "/check-in-out",
    hash: "check-in",
    roles: ["guest", "receptionist"],
  },
  {
    id: "uses-services",
    step: 5,
    title: "Guest uses hotel services",
    icon: "Hotel",
    path: "/services",
    hash: "my-services",
    roles: ["guest"],
  },
  {
    id: "ai",
    step: 6,
    title: "AI suggests personalized services",
    icon: "Sparkles",
    path: "/ai-personalization",
    hash: "ai-suggestions",
    roles: ["guest"],
  },
  {
    id: "request",
    step: 7,
    title: "Guest requests room service / housekeeping",
    icon: "ConciergeBell",
    path: "/services",
    hash: "guest-request",
    roles: ["guest"],
  },
  {
    id: "fulfill",
    step: 8,
    title: "Staff fulfills requests",
    icon: "CheckCircle2",
    path: "/services",
    hash: "task-queue",
    roles: ["staff"],
  },
];

export function guestStayStepHref(step: GuestStayStep): string {
  return step.hash ? `${step.path}#${step.hash}` : step.path;
}

export type StayStepState = "done" | "active" | "pending";

export interface StayProgressInput {
  role: "guest" | "receptionist" | "staff";
  bookingStatus?: string;
  guestArrived?: boolean;
  chargesVerified?: boolean;
  room?: string;
  serviceCount?: number;
  completedServiceCount?: number;
  recommendationCount?: number;
  openTaskCount?: number;
  arrivalsWaiting?: number;
}

export function computeStayStepState(
  stepId: string,
  input: StayProgressInput,
): StayStepState {
  const checkedIn = input.bookingStatus === "checked-in";
  const confirmed = input.bookingStatus === "confirmed" || input.bookingStatus === "pending";
  const hasRoom = Boolean(input.room && input.room.trim());

  switch (stepId) {
    case "arrive":
      if (input.guestArrived || checkedIn) return "done";
      if (confirmed) return "active";
      return "pending";
    case "verify":
      if (checkedIn) return "done";
      if (input.guestArrived || confirmed) return "active";
      return "pending";
    case "assign":
      if (checkedIn && hasRoom) return "done";
      if (input.guestArrived || confirmed) return "active";
      return "pending";
    case "checkin":
      if (checkedIn) return "done";
      if (input.guestArrived) return "active";
      return "pending";
    case "uses-services":
      if (!checkedIn) return "pending";
      if ((input.serviceCount ?? 0) > 0) return "done";
      return "active";
    case "ai":
      if (!checkedIn) return "pending";
      if ((input.recommendationCount ?? 0) > 0) return "done";
      return "active";
    case "request":
      if ((input.serviceCount ?? 0) > 0) return "done";
      if (checkedIn) return "active";
      return "pending";
    case "fulfill":
      if ((input.completedServiceCount ?? 0) > 0) return "done";
      if ((input.openTaskCount ?? 0) > 0 || (input.serviceCount ?? 0) > 0) return "active";
      return "pending";
    default:
      return "pending";
  }
}
