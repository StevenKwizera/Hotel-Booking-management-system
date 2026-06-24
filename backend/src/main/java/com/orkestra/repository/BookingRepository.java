package com.orkestra.repository;

import com.orkestra.domain.entity.Booking;
import com.orkestra.domain.enums.BookingStatus;
import java.time.LocalDate;
import java.util.Collection;
import java.util.List;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface BookingRepository extends JpaRepository<Booking, UUID> {
    List<Booking> findByGuestUserIdOrderByCreatedAtDesc(UUID guestUserId);
    List<Booking> findAllByOrderByCreatedAtDesc();
    List<Booking> findByStatus(BookingStatus status);
    @Query("SELECT b FROM Booking b WHERE b.checkIn = :date")
    List<Booking> findArrivalsOnDate(@Param("date") LocalDate date);

    @Query("SELECT b FROM Booking b WHERE b.checkOut = :date")
    List<Booking> findDeparturesOnDate(@Param("date") LocalDate date);

    @Query("""
            SELECT b FROM Booking b
            WHERE b.status = com.orkestra.domain.enums.BookingStatus.CHECKED_IN
            AND b.checkoutRequested = true
            ORDER BY b.checkOut ASC
            """)
    List<Booking> findCheckoutQueue();
    long countByStatus(BookingStatus status);

    long countByGuestUserIdAndStatusIn(UUID guestUserId, Collection<BookingStatus> statuses);

    @Query("""
            SELECT COUNT(b) FROM Booking b
            WHERE b.checkIn <= :day AND b.checkOut > :day
            AND b.status NOT IN (com.orkestra.domain.enums.BookingStatus.CANCELLED)
            """)
    long countOccupiedOnDate(@Param("day") LocalDate day);

    @Query("""
            SELECT COALESCE(SUM(b.amountRwf), 0) FROM Booking b
            WHERE b.checkIn <= :day AND b.checkOut > :day
            AND b.status IN (
                com.orkestra.domain.enums.BookingStatus.CONFIRMED,
                com.orkestra.domain.enums.BookingStatus.CHECKED_IN,
                com.orkestra.domain.enums.BookingStatus.CHECKED_OUT
            )
            """)
    long sumRevenueForOccupiedOnDate(@Param("day") LocalDate day);

    @Query("""
            SELECT CASE WHEN COUNT(b) > 0 THEN true ELSE false END FROM Booking b
            WHERE b.room.id = :roomId
            AND b.status <> com.orkestra.domain.enums.BookingStatus.CANCELLED
            AND b.checkIn < :checkOut AND b.checkOut > :checkIn
            """)
    boolean existsOverlappingBooking(
            @Param("roomId") UUID roomId,
            @Param("checkIn") LocalDate checkIn,
            @Param("checkOut") LocalDate checkOut);
}
