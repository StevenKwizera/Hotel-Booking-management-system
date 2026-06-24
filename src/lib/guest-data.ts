/** Nightly rates (RWF) — Standard 100, Deluxe 170, Suite 200 */
export const ROOM_TYPE_RATES: Record<"Standard" | "Deluxe" | "Suite", number> = {
  Standard: 100,
  Deluxe: 170,
  Suite: 200,
};

export function nightsBetween(checkIn: string, checkOut: string): number {
  const a = new Date(checkIn);
  const b = new Date(checkOut);
  return Math.max(1, Math.round((b.getTime() - a.getTime()) / (1000 * 60 * 60 * 24)));
}

export function bookingNightlyRate(booking: {
  amount: number;
  grossAmount?: number;
  checkIn: string;
  checkOut: string;
  roomType?: "Standard" | "Deluxe" | "Suite";
}): number {
  if (booking.roomType && ROOM_TYPE_RATES[booking.roomType]) {
    return ROOM_TYPE_RATES[booking.roomType];
  }
  const nights = nightsBetween(booking.checkIn, booking.checkOut);
  const subtotal = booking.grossAmount ?? booking.amount;
  return nights > 0 ? Math.round(subtotal / nights) : subtotal;
}
