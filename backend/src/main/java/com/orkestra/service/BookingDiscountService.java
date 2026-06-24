package com.orkestra.service;

import com.orkestra.domain.entity.UserAccount;
import com.orkestra.domain.enums.BookingStatus;
import com.orkestra.repository.BookingRepository;
import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.UUID;
import org.springframework.stereotype.Service;

@Service
public class BookingDiscountService {

    public static final int EARLY_BOOKING_DAYS = 14;
    public static final int EARLY_BOOKING_PERCENT = 5;
    public static final int REPEAT_GUEST_PERCENT = 10;
    /** Guest must have 2+ previous completed stays (3rd booking onwards). */
    public static final int REPEAT_GUEST_MIN_PREVIOUS_BOOKINGS = 2;

    private final BookingRepository bookingRepository;

    public BookingDiscountService(BookingRepository bookingRepository) {
        this.bookingRepository = bookingRepository;
    }

    public record Result(
            long grossRwf,
            long discountRwf,
            long payableRwf,
            boolean earlyBookingApplied,
            boolean repeatGuestApplied,
            int earlyBookingPercent,
            int repeatGuestPercent) {}

    public Result calculate(long grossRwf, LocalDate checkIn, UserAccount guest) {
        int earlyPct = qualifiesEarlyBooking(checkIn) ? EARLY_BOOKING_PERCENT : 0;
        int repeatPct = qualifiesRepeatGuest(guest) ? REPEAT_GUEST_PERCENT : 0;
        int totalPct = earlyPct + repeatPct;
        long discount = totalPct == 0 ? 0 : (grossRwf * totalPct) / 100;
        long payable = Math.max(0, grossRwf - discount);
        return new Result(
                grossRwf,
                discount,
                payable,
                earlyPct > 0,
                repeatPct > 0,
                earlyPct,
                repeatPct);
    }

    public boolean qualifiesEarlyBooking(LocalDate checkIn) {
        return ChronoUnit.DAYS.between(LocalDate.now(), checkIn) >= EARLY_BOOKING_DAYS;
    }

    public boolean qualifiesRepeatGuest(UserAccount guest) {
        if (guest == null) {
            return false;
        }
        return countCompletedBookings(guest.getId()) >= REPEAT_GUEST_MIN_PREVIOUS_BOOKINGS;
    }

    public long countCompletedBookings(UUID guestUserId) {
        return bookingRepository.countByGuestUserIdAndStatusIn(
                guestUserId,
                List.of(BookingStatus.CONFIRMED, BookingStatus.CHECKED_IN, BookingStatus.CHECKED_OUT));
    }
}
