/** Max guests per room — matches backend BookingValidation */
export const MAX_ROOM_GUESTS = 2;

export function todayIsoDate(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function validateGuestCount(count: number): string | null {
  if (!Number.isFinite(count) || count < 1) {
    return "Enter at least 1 guest";
  }
  if (count > MAX_ROOM_GUESTS) {
    return `Each room holds a maximum of ${MAX_ROOM_GUESTS} guests`;
  }
  return null;
}

export function validateStayDates(checkIn: string, checkOut: string): string | null {
  if (!checkIn || !checkOut) {
    return "Select check-in and check-out dates";
  }
  const today = todayIsoDate();
  if (checkIn < today) {
    return "Check-in cannot be in the past — choose today or a future date";
  }
  if (checkOut <= checkIn) {
    return "Check-out must be after check-in";
  }
  return null;
}
