export type UserRole =
  | "admin"
  | "management"
  | "receptionist"
  | "staff"
  | "finance"
  | "guest";

export type ThemeMode = "light" | "dark";
export type AccentColor = "gold" | "emerald" | "sapphire" | "rose";
export type Density = "compact" | "comfortable" | "spacious";

export interface AppSettings {
  theme: ThemeMode;
  accent: AccentColor;
  density: Density;
  sidebarCollapsed: boolean;
  hotelName: string;
  branchName: string;
}

export interface NavItem {
  id: string;
  label: string;
  path: string;
  icon: string;
  module: number;
  roles: UserRole[];
  description: string;
}

export interface KpiMetric {
  id: string;
  label: string;
  value: string | number;
  change?: number;
  trend?: "up" | "down" | "neutral";
  icon: string;
}

export interface Booking {
  id: string;
  guestName: string;
  room: string;
  checkIn: string;
  checkOut: string;
  status: "confirmed" | "pending" | "approved" | "cancelled" | "checked-in" | "checked-out";
  amount: number;
  grossAmount?: number;
  discountRwf?: number;
  earlyBookingDiscount?: boolean;
  repeatGuestDiscount?: boolean;
  roomType?: "Standard" | "Deluxe" | "Suite";
  guestCount?: number;
  guestEmail?: string;
  checkoutRequested?: boolean;
  chargesVerified?: boolean;
  invoiceIssued?: boolean;
  guestArrived?: boolean;
}

export interface GuestPayment {
  id: string;
  guestName?: string;
  amount: number;
  /** Display label from API (e.g. MTN MoMo, Bank of Kigali) */
  method: string;
  status: "completed" | "pending" | "refunded" | "flagged";
  date: string;
  verified?: boolean;
  reference?: string | null;
  bookingCode?: string | null;
  checkIn?: string | null;
  checkOut?: string | null;
  room?: string | null;
  roomType?: string | null;
  guestCount?: number | null;
  bookingTotal?: number | null;
  confirmationEmail?: string | null;
  guestEmail?: string | null;
}

export interface GuestNotification {
  id: string;
  title: string;
  body: string;
  category: "booking" | "payment" | "service" | "recommendation" | "checkout" | "system";
  time: string;
  read: boolean;
}

export interface GuestRecommendation {
  id: string;
  title: string;
  description: string;
  confidence: number;
  saved?: boolean;
  applied?: boolean;
}

export interface GuestServiceRequest extends ServiceRequest {
  description: string;
  guestEmail: string;
}

export interface Guest {
  id: string;
  name: string;
  email: string;
  phone: string;
  visits: number;
  tier: "standard" | "silver" | "gold" | "platinum";
  preferences: string[];
}

export interface ServiceRequest {
  id: string;
  type: "housekeeping" | "room-service" | "maintenance" | "concierge";
  room: string;
  status: "open" | "in-progress" | "completed";
  assignedStaff?: string;
  priority: "low" | "medium" | "high";
  createdAt: string;
  description?: string;
}
