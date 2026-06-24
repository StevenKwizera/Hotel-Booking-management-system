import type { Booking, GuestPayment } from "@/types";
import type { BranchApi, OccupancyApi } from "@/lib/api";

export function countCancellationsThisWeek(bookings: Booking[]): number {
  const weekAgo = new Date();
  weekAgo.setDate(weekAgo.getDate() - 7);
  return bookings.filter((b) => {
    if (b.status !== "cancelled") return false;
    const d = new Date(b.checkIn);
    return !Number.isNaN(d.getTime()) && d >= weekAgo;
  }).length;
}

export function sumPayments(
  payments: GuestPayment[],
  predicate: (p: GuestPayment) => boolean,
): number {
  return payments.filter(predicate).reduce((s, p) => s + p.amount, 0);
}

export function consolidatedBranchMetrics(branches: BranchApi[]) {
  if (branches.length === 0) {
    return { totalRooms: 0, avgOccupancy: 0, branchCount: 0 };
  }
  const totalRooms = branches.reduce((s, b) => s + b.rooms, 0);
  const avgOccupancy = Math.round(
    branches.reduce((s, b) => s + b.occupancy, 0) / branches.length,
  );
  return { totalRooms, avgOccupancy, branchCount: branches.length };
}

export function formatRwf(amount: number): string {
  if (amount >= 1_000_000) return `RWF ${(amount / 1_000_000).toFixed(1)}M`;
  if (amount >= 1_000) return `RWF ${Math.round(amount / 1_000)}K`;
  return `RWF ${amount.toLocaleString()}`;
}

export function analyticsFromOccupancy(occupancy: OccupancyApi[]) {
  if (occupancy.length === 0) return [];
  const avgOcc =
    occupancy.reduce((s, d) => s + (d.occupancy ?? 0), 0) / occupancy.length;
  const totalRev = occupancy.reduce((s, d) => s + (d.revenue ?? 0), 0);
  return [
    { label: "Avg. occupancy", value: `${Math.round(avgOcc)}%` },
    { label: "Revenue (7d)", value: `${totalRev.toFixed(1)}M RWF` },
    { label: "Peak day", value: occupancy.reduce((a, b) => ((b.occupancy ?? 0) > (a.occupancy ?? 0) ? b : a)).day },
    { label: "Data points", value: String(occupancy.length) },
  ];
}
