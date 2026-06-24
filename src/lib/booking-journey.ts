/** Guest booking workflow — search through confirmation */

export interface BookingFlowStep {
  id: string;
  step: number;
  title: string;
  icon: string;
  path: string;
  hash?: string;
}

export const BOOKING_FLOW_STEPS: BookingFlowStep[] = [
  {
    id: "login",
    step: 1,
    title: "Guest logs in / registers",
    icon: "LogIn",
    path: "/login",
  },
  {
    id: "search",
    step: 2,
    title: "Search available rooms",
    icon: "Search",
    path: "/reservations",
    hash: "search-dates",
  },
  {
    id: "availability",
    step: 3,
    title: "System shows room availability",
    icon: "Bed",
    path: "/reservations",
    hash: "availability",
  },
  {
    id: "select",
    step: 4,
    title: "Guest selects room",
    icon: "MousePointerClick",
    path: "/reservations",
    hash: "select-room",
  },
  {
    id: "details",
    step: 5,
    title: "Guest enters booking details",
    icon: "ClipboardList",
    path: "/reservations",
    hash: "booking-details",
  },
  {
    id: "price",
    step: 6,
    title: "System calculates price",
    icon: "Calculator",
    path: "/reservations",
    hash: "price",
  },
  {
    id: "payment",
    step: 7,
    title: "Payment processed",
    icon: "CreditCard",
    path: "/reservations",
    hash: "payment",
  },
  {
    id: "confirmed",
    step: 8,
    title: "Booking confirmed",
    icon: "CalendarCheck",
    path: "/reservations",
    hash: "confirmation",
  },
  {
    id: "notification",
    step: 9,
    title: "Notification sent",
    icon: "Bell",
    path: "/communications",
  },
];

export function bookingStepHref(step: BookingFlowStep): string {
  return step.hash ? `${step.path}#${step.hash}` : step.path;
}

export type BookingStepState = "done" | "active" | "pending";

export interface BookingProgressInput {
  isLoggedIn: boolean;
  hasDates: boolean;
  roomsSearched: boolean;
  roomSelected: boolean;
  hasDetails: boolean;
  hasQuote: boolean;
  paymentComplete: boolean;
  bookingConfirmed: boolean;
  notificationSent: boolean;
}

export function computeBookingStepState(
  stepId: string,
  input: BookingProgressInput,
): BookingStepState {
  switch (stepId) {
    case "login":
      return input.isLoggedIn ? "done" : "active";
    case "search":
      if (!input.isLoggedIn) return "pending";
      return input.hasDates ? "done" : "active";
    case "availability":
      if (!input.hasDates) return "pending";
      return input.roomsSearched ? "done" : "active";
    case "select":
      if (!input.roomsSearched) return "pending";
      return input.roomSelected ? "done" : "active";
    case "details":
      if (!input.roomSelected) return "pending";
      return input.hasDetails ? "done" : "active";
    case "price":
      if (!input.hasDetails) return "pending";
      return input.hasQuote ? "done" : "active";
    case "payment":
      if (!input.hasQuote) return "pending";
      return input.paymentComplete ? "done" : "active";
    case "confirmed":
      return input.bookingConfirmed ? "done" : "pending";
    case "notification":
      return input.notificationSent ? "done" : input.bookingConfirmed ? "active" : "pending";
    default:
      return "pending";
  }
}
