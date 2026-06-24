/** Mirrors backend BookingDiscountService rules. */
export const EARLY_BOOKING_DAYS = 14;
export const EARLY_BOOKING_PERCENT = 5;
export const REPEAT_GUEST_PERCENT = 10;
export const REPEAT_GUEST_MIN_STAYS = 2;

export function daysUntilCheckIn(checkIn: string): number {
  const start = new Date(`${checkIn}T00:00:00`);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return Math.floor((start.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
}

export function calculateGuestDiscount(
  subtotal: number,
  checkIn: string,
  completedStays: number,
) {
  const earlyBookingDiscount = daysUntilCheckIn(checkIn) >= EARLY_BOOKING_DAYS;
  const repeatGuestDiscount = completedStays >= REPEAT_GUEST_MIN_STAYS;
  let percent = 0;
  if (earlyBookingDiscount) percent += EARLY_BOOKING_PERCENT;
  if (repeatGuestDiscount) percent += REPEAT_GUEST_PERCENT;
  const discountRwf = percent === 0 ? 0 : Math.round((subtotal * percent) / 100);
  const totalRwf = Math.max(0, subtotal - discountRwf);
  return {
    subtotalRwf: subtotal,
    discountRwf,
    totalRwf,
    earlyBookingDiscount,
    repeatGuestDiscount,
  };
}

export function normalizeBookingQuote(
  quote: {
    subtotalRwf?: number;
    discountRwf?: number;
    totalRwf: number;
    earlyBookingDiscount?: boolean;
    repeatGuestDiscount?: boolean;
    nightlyRateRwf: number;
    nights: number;
    roomNumber: string;
    roomType: string;
    checkIn: string;
    checkOut: string;
    guestCount: number;
    available: boolean;
  },
  checkIn: string,
  completedStays: number,
) {
  if (quote.subtotalRwf != null && quote.discountRwf != null) {
    return {
      ...quote,
      subtotalRwf: quote.subtotalRwf,
      discountRwf: quote.discountRwf,
      totalRwf: quote.totalRwf,
      earlyBookingDiscount: quote.earlyBookingDiscount ?? false,
      repeatGuestDiscount: quote.repeatGuestDiscount ?? false,
    };
  }
  const subtotal = quote.totalRwf ?? quote.nightlyRateRwf * Math.max(1, quote.nights);
  const pricing = calculateGuestDiscount(subtotal, checkIn, completedStays);
  return { ...quote, ...pricing };
}
