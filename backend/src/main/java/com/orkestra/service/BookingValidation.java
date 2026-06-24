package com.orkestra.service;

import java.time.LocalDate;

public final class BookingValidation {

    public static final int MAX_GUESTS_PER_ROOM = 2;

    private BookingValidation() {}

    public static void validateGuestCount(int guestCount) {
        if (guestCount < 1 || guestCount > MAX_GUESTS_PER_ROOM) {
            throw new IllegalArgumentException(
                    "Each room holds a maximum of " + MAX_GUESTS_PER_ROOM + " guests");
        }
    }

    /** Guests may only book from today onward. */
    public static void validateGuestStayDates(LocalDate checkIn, LocalDate checkOut) {
        LocalDate today = LocalDate.now();
        if (checkIn.isBefore(today)) {
            throw new IllegalArgumentException(
                    "Check-in cannot be in the past. Choose today or a future date.");
        }
        if (!checkOut.isAfter(checkIn)) {
            throw new IllegalArgumentException("Check-out must be after check-in");
        }
    }
}
