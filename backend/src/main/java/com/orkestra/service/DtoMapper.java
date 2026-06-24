package com.orkestra.service;

import com.orkestra.domain.entity.*;
import com.orkestra.domain.enums.*;
import com.orkestra.dto.ApiDtos;
import java.time.Instant;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;

public final class DtoMapper {

    private static final DateTimeFormatter TIME_FMT =
            DateTimeFormatter.ofPattern("HH:mm").withZone(ZoneId.of("Africa/Kigali"));
    private static final DateTimeFormatter DATE_FMT = DateTimeFormatter.ISO_LOCAL_DATE;
    private static final DateTimeFormatter DATETIME_FMT =
            DateTimeFormatter.ofPattern("dd MMM yyyy, HH:mm").withZone(ZoneId.of("Africa/Kigali"));

    private DtoMapper() {}

    public static ApiDtos.BookingDto toBooking(Booking b) {
        String status = switch (b.getStatus()) {
            case CHECKED_IN -> "checked-in";
            case CHECKED_OUT -> "checked-out";
            case CANCELLED -> "cancelled";
            default -> b.getStatus().name().toLowerCase();
        };
        long gross = b.getGrossAmountRwf() > 0 ? b.getGrossAmountRwf() : b.getAmountRwf();
        return new ApiDtos.BookingDto(
                b.getBookingCode(),
                b.getGuestName(),
                b.getGuestEmail(),
                b.getRoomLabel() != null ? b.getRoomLabel() : (b.getRoom() != null ? b.getRoom().getRoomNumber() : ""),
                b.getCheckIn().format(DATE_FMT),
                b.getCheckOut().format(DATE_FMT),
                status,
                b.getAmountRwf(),
                gross,
                b.getDiscountRwf(),
                b.isEarlyBookingDiscount(),
                b.isRepeatGuestDiscount(),
                b.getRoomType() != null ? capitalize(b.getRoomType().name()) : null,
                b.getGuestCount(),
                b.isCheckoutRequested(),
                b.isChargesVerified(),
                b.getInvoiceIssuedAt() != null,
                b.isGuestArrived());
    }

    public static ApiDtos.GuestDto toGuest(GuestProfile g) {
        return new ApiDtos.GuestDto(
                g.getId().toString(),
                g.getUser().getName(),
                g.getUser().getEmail(),
                g.getPhone() != null ? g.getPhone() : "",
                g.getVisitCount(),
                g.getTier().name().toLowerCase(),
                g.getPreferences(),
                g.getBalanceRwf());
    }

    public static ApiDtos.PaymentDto toPayment(Payment p) {
        Booking b = p.getBooking();
        String bookingCode = b != null ? b.getBookingCode() : null;
        String checkIn = b != null ? b.getCheckIn().format(DATE_FMT) : null;
        String checkOut = b != null ? b.getCheckOut().format(DATE_FMT) : null;
        String room = b != null
                ? (b.getRoomLabel() != null ? b.getRoomLabel()
                        : (b.getRoom() != null ? b.getRoom().getRoomNumber() : null))
                : null;
        String roomType = b != null && b.getRoomType() != null ? capitalize(b.getRoomType().name()) : null;
        Integer guestCount = b != null ? b.getGuestCount() : null;
        Long bookingTotal = b != null ? b.getAmountRwf() : null;
        String guestEmail = p.getConfirmationEmail();
        if (guestEmail == null || guestEmail.isBlank()) {
            guestEmail = b != null && b.getGuestEmail() != null ? b.getGuestEmail() : null;
            if (guestEmail == null && p.getGuestUser() != null) {
                guestEmail = p.getGuestUser().getEmail();
            }
        }
        return new ApiDtos.PaymentDto(
                p.getPaymentCode(),
                p.getGuestName(),
                p.getAmountRwf(),
                formatMethod(p.getMethod()),
                p.getStatus().name().toLowerCase(),
                p.getCreatedAt().atZone(ZoneId.of("Africa/Kigali")).toLocalDate().format(DATE_FMT),
                p.isFinanceVerified(),
                p.getIremboReference(),
                bookingCode,
                checkIn,
                checkOut,
                room,
                roomType,
                guestCount,
                bookingTotal,
                p.getConfirmationEmail(),
                guestEmail);
    }

    public static ApiDtos.ServiceRequestDto toService(ServiceRequest s) {
        return new ApiDtos.ServiceRequestDto(
                s.getRequestCode(),
                s.getType().name().toLowerCase().replace("_", "-"),
                s.getRoom(),
                s.getDescription(),
                s.getStatus().name().toLowerCase().replace("_", "-"),
                s.getPriority().name().toLowerCase(),
                TIME_FMT.format(s.getCreatedAt()),
                s.getGuestEmail(),
                s.getAssignedStaffName());
    }

    public static ApiDtos.RecommendationDto toRec(Recommendation r) {
        return new ApiDtos.RecommendationDto(
                r.getId().toString(),
                r.getTitle(),
                r.getDescription(),
                r.getConfidence(),
                r.isApplied(),
                r.isSaved());
    }

    public static ApiDtos.NotificationDto toNotif(Notification n) {
        return new ApiDtos.NotificationDto(
                n.getId().toString(),
                n.getTitle(),
                n.getBody(),
                n.getCategory().name().toLowerCase(),
                TIME_FMT.format(n.getCreatedAt()),
                n.isRead());
    }

    public static ApiDtos.BranchDto toBranch(Branch b) {
        return new ApiDtos.BranchDto(
                b.getId().toString(),
                b.getName(),
                b.getTotalRooms(),
                b.getOccupancyPercent(),
                b.getStatus());
    }

    public static RoomType parseRoomType(String s) {
        return RoomType.valueOf(s.toUpperCase());
    }

    public static ServiceType parseServiceType(String s) {
        return ServiceType.valueOf(s.toUpperCase().replace("-", "_"));
    }

    public static PaymentMethod parsePaymentMethod(String s) {
        return PaymentMethod.PAYPACK;
    }

    public static Priority parsePriority(String s) {
        if (s == null) return Priority.MEDIUM;
        return Priority.valueOf(s.toUpperCase());
    }

    private static String formatMethod(PaymentMethod m) {
        return "Paypack MoMo";
    }

    private static String capitalize(String s) {
        if (s == null || s.isEmpty()) return s;
        return s.charAt(0) + s.substring(1).toLowerCase().replace("_", " ");
    }

    public static String capitalizeRoomType(RoomType type) {
        return capitalize(type.name());
    }

    public static ApiDtos.FeedbackDto toFeedback(GuestFeedback f) {
        return new ApiDtos.FeedbackDto(
                f.getFeedbackCode(),
                f.getGuestName(),
                f.getGuestEmail(),
                f.getRoom(),
                f.getRating(),
                f.getCategory().name().toLowerCase(),
                f.getSubject(),
                f.getMessage(),
                DATETIME_FMT.format(f.getCreatedAt()),
                f.getStaffReply(),
                f.getRepliedByName(),
                f.getRepliedAt() != null ? DATETIME_FMT.format(f.getRepliedAt()) : null);
    }

    public static String capitalizeFeedbackCategory(FeedbackCategory category) {
        return capitalize(category.name());
    }

    public static ApiDtos.MealOrderDto toMealOrder(MealOrder o) {
        return new ApiDtos.MealOrderDto(
                o.getOrderCode(),
                o.getGuestName(),
                o.getGuestEmail(),
                o.getRoom(),
                o.getMealCategory().name().toLowerCase(),
                o.getStatus().name().toLowerCase().replace("_", "-"),
                o.getTotalRwf(),
                o.getGuestNotes(),
                o.getRejectionReason(),
                o.getServerName(),
                o.getPaymentCode(),
                o.getLines().stream()
                        .map(l -> new ApiDtos.MealOrderLineDto(
                                l.getMenuItemId(),
                                l.getItemName(),
                                l.getQuantity(),
                                l.getUnitPriceRwf(),
                                l.getLineTotalRwf()))
                        .toList(),
                DATETIME_FMT.format(o.getCreatedAt()));
    }

    public static MealCategory parseMealCategory(String raw) {
        if (raw == null || raw.isBlank()) {
            throw new IllegalArgumentException("Meal category is required");
        }
        return MealCategory.valueOf(raw.trim().toUpperCase());
    }
}
