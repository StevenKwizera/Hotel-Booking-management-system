import type { Booking, Guest, KpiMetric, ServiceRequest } from "@/types";

export const KPI_METRICS: KpiMetric[] = [
  { id: "occupancy", label: "Occupancy Rate", value: "78%", change: 4.2, trend: "up", icon: "Bed" },
  { id: "revenue", label: "Revenue (Today)", value: "RWF 2.4M", change: 12.5, trend: "up", icon: "TrendingUp" },
  { id: "bookings", label: "Active Bookings", value: 34, change: -2, trend: "down", icon: "CalendarCheck" },
  { id: "satisfaction", label: "Guest Satisfaction", value: "4.8", change: 0.3, trend: "up", icon: "Star" },
];

export const RECENT_BOOKINGS: Booking[] = [
  { id: "BK-1042", guestName: "Jean Baptiste N.", room: "Suite 301", checkIn: "2026-05-20", checkOut: "2026-05-23", status: "checked-in", amount: 285000 },
  { id: "BK-1041", guestName: "Marie Claire U.", room: "Deluxe 205", checkIn: "2026-05-21", checkOut: "2026-05-25", status: "confirmed", amount: 420000 },
  { id: "BK-1040", guestName: "David K. M.", room: "Standard 112", checkIn: "2026-05-19", checkOut: "2026-05-20", status: "pending", amount: 95000 },
  { id: "BK-1039", guestName: "Grace A. T.", room: "Suite 302", checkIn: "2026-05-18", checkOut: "2026-05-19", status: "cancelled", amount: 0 },
];

export const GUESTS: Guest[] = [
  { id: "G-001", name: "Jean Baptiste Nkurunziza", email: "jb.n@email.com", phone: "+250 788 123 456", visits: 12, tier: "platinum", preferences: ["Late checkout", "Quiet room", "Vegetarian breakfast"] },
  { id: "G-002", name: "Marie Claire Uwase", email: "mc.uwase@email.com", phone: "+250 789 234 567", visits: 5, tier: "gold", preferences: ["High floor", "Extra pillows"] },
  { id: "G-003", name: "David Kamali", email: "d.kamali@email.com", phone: "+250 787 345 678", visits: 2, tier: "silver", preferences: ["Airport pickup"] },
  { id: "G-004", name: "Grace Akimana", email: "g.akimana@email.com", phone: "+250 786 456 789", visits: 8, tier: "gold", preferences: ["Spa package", "Champagne on arrival"] },
];

export const SERVICE_REQUESTS: ServiceRequest[] = [
  { id: "SR-88", type: "housekeeping", room: "205", status: "in-progress", priority: "medium", createdAt: "10:32" },
  { id: "SR-87", type: "room-service", room: "301", status: "open", priority: "high", createdAt: "10:15" },
  { id: "SR-86", type: "maintenance", room: "112", status: "open", priority: "high", createdAt: "09:48" },
  { id: "SR-85", type: "concierge", room: "302", status: "completed", priority: "low", createdAt: "08:20" },
];

export const OCCUPANCY_DATA = [
  { day: "Mon", occupancy: 65, revenue: 1.8 },
  { day: "Tue", occupancy: 72, revenue: 2.1 },
  { day: "Wed", occupancy: 78, revenue: 2.4 },
  { day: "Thu", occupancy: 82, revenue: 2.6 },
  { day: "Fri", occupancy: 88, revenue: 3.1 },
  { day: "Sat", occupancy: 95, revenue: 3.8 },
  { day: "Sun", occupancy: 70, revenue: 2.0 },
];

export const AI_RECOMMENDATIONS = [
  { guest: "Jean Baptiste N.", suggestion: "Offer spa package — visited spa 3× last stay", confidence: 92 },
  { guest: "Grace A. T.", suggestion: "Prepare anniversary amenity — noted in profile", confidence: 88 },
  { guest: "Marie Claire U.", suggestion: "Upsell suite upgrade — prefers high-floor deluxe", confidence: 76 },
];

export const BRANCHES = [
  { id: "nl-kigali", name: "Net Luna Villa — Kigali", occupancy: 78, rooms: 48, status: "active" },
  { id: "nl-musanze", name: "Net Luna Villa — Musanze", occupancy: 62, rooms: 24, status: "active" },
  { id: "nl-huye", name: "Net Luna Villa — Huye", occupancy: 45, rooms: 18, status: "maintenance" },
];
