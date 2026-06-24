package com.orkestra.service;

import com.orkestra.domain.entity.*;
import com.orkestra.domain.enums.*;
import com.orkestra.dto.ApiDtos;
import com.orkestra.repository.*;
import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Orchestrates end-to-end hotel workflows per Orkestra master specification.
 */
@Service
public class WorkflowService {

    private final BookingRepository bookingRepository;
    private final RoomRepository roomRepository;
    private final GuestProfileRepository guestProfileRepository;
    private final ServiceRequestRepository serviceRequestRepository;
    private final UserAccountRepository userAccountRepository;
    private final NotificationRepository notificationRepository;
    private final AuditService auditService;
    private final CurrentUserService currentUser;

    private static final long SERVICE_CHARGE_RWF = 25_000L;

    public WorkflowService(
            BookingRepository bookingRepository,
            RoomRepository roomRepository,
            GuestProfileRepository guestProfileRepository,
            ServiceRequestRepository serviceRequestRepository,
            UserAccountRepository userAccountRepository,
            NotificationRepository notificationRepository,
            AuditService auditService,
            CurrentUserService currentUser) {
        this.bookingRepository = bookingRepository;
        this.roomRepository = roomRepository;
        this.guestProfileRepository = guestProfileRepository;
        this.serviceRequestRepository = serviceRequestRepository;
        this.userAccountRepository = userAccountRepository;
        this.notificationRepository = notificationRepository;
        this.auditService = auditService;
        this.currentUser = currentUser;
    }

    public Map<String, Object> workflowStatus() {
        Map<String, Object> flows = new LinkedHashMap<>();
        flows.put("booking", Map.of(
                "steps", List.of(
                        "Guest logs in / registers",
                        "Search available rooms",
                        "System shows room availability",
                        "Guest selects room",
                        "Guest enters booking details",
                        "System calculates price",
                        "Payment processed via Paypack MoMo",
                        "Booking confirmed",
                        "Notification sent (email/SMS/app)"),
                "status", "operational"));
        flows.put("checkIn", Map.of(
                "steps", List.of(
                        "Guest arrives at hotel",
                        "Receptionist verifies booking",
                        "Room assigned",
                        "Guest checks in"),
                "status", "operational"));
        flows.put("guestStay", Map.of(
                "steps", List.of(
                        "Guest arrives at hotel",
                        "Receptionist verifies booking",
                        "Room assigned",
                        "Guest checks in",
                        "Guest uses hotel services",
                        "AI suggests personalized services",
                        "Guest requests room service / housekeeping",
                        "Staff fulfills requests"),
                "status", "operational"));
        flows.put("service", Map.of(
                "steps", List.of(
                        "Guest requests service",
                        "Notify staff",
                        "Perform task",
                        "Update completion",
                        "Save logs"),
                "status", "operational"));
        flows.put("payment", Map.of(
                "steps", List.of(
                        "Calculate bill",
                        "Process gateway",
                        "Generate receipt",
                        "Store payment"),
                "status", "operational"));
        flows.put("checkOut", Map.of(
                "steps", List.of(
                        "Guest requests check-out",
                        "System calculates total bill",
                        "Receptionist verifies charges",
                        "Guest pays remaining balance",
                        "Invoice generated",
                        "Room marked as available",
                        "Guest history saved"),
                "status", "operational"));
        flows.put("aiPersonalization", Map.of(
                "steps", List.of(
                        "Collect guest data",
                        "Analyze behavior",
                        "Generate recommendations",
                        "Deliver suggestions"),
                "status", "operational"));
        flows.put("reporting", Map.of(
                "steps", List.of(
                        "Collect operational data",
                        "Process analytics",
                        "Manager dashboards",
                        "Decision support"),
                "status", "operational"));
        flows.put("security", Map.of(
                "steps", List.of(
                        "User login",
                        "Verify credentials",
                        "OTP validation (if enabled)",
                        "Role-based access",
                        "Audit logging"),
                "status", "operational"));
        flows.put("administration", Map.of(
                "steps", List.of(
                        "Login as administrator",
                        "Manage users (create / edit / delete)",
                        "Assign roles & permissions",
                        "Configure system settings",
                        "Monitor security logs",
                        "Manage hotel branches",
                        "Perform database backups",
                        "View audit reports"),
                "status", "operational"));
        flows.put("management", Map.of(
                "steps", List.of(
                        "Login as hotel manager",
                        "Access executive dashboard",
                        "View KPIs (occupancy, revenue, performance)",
                        "Monitor staff performance",
                        "Review reports & analytics",
                        "Make operational decisions"),
                "status", "operational"));
        flows.put("finance", Map.of(
                "steps", List.of(
                        "Login as finance officer",
                        "View all payments",
                        "Verify transactions",
                        "Approve or flag payments",
                        "Generate financial reports",
                        "Monitor revenue"),
                "status", "operational"));
        flows.put("staff", Map.of(
                "steps", List.of(
                        "Login as hotel staff",
                        "Receive task notification",
                        "View assigned request",
                        "Perform service (cleaning / repair / delivery)",
                        "Update task status",
                        "Mark task as completed",
                        "System logs service record"),
                "status", "operational"));
        flows.put("receptionist", Map.of(
                "steps", List.of(
                        "Login as receptionist",
                        "View bookings",
                        "Verify guest reservation",
                        "Assign room",
                        "Process check-in",
                        "Manage guest requests",
                        "Generate bills",
                        "Process check-out",
                        "Update room status"),
                "status", "operational"));
        return Map.of(
                "system", "Orkestra Hospitality Management System",
                "partner", "Net Luna Villa Hotel / AUCA",
                "modules", 10,
                "stakeholders", List.of(
                        "Guest", "Receptionist", "Hotel Staff", "Finance Officer",
                        "Hotel Manager", "System Administrator"),
                "workflows", flows);
    }

    public List<ApiDtos.BookingDto> todayArrivals() {
        LocalDate today = LocalDate.now();
        return bookingRepository.findArrivalsOnDate(today).stream()
                .filter(b -> b.getStatus() == BookingStatus.CONFIRMED || b.getStatus() == BookingStatus.PENDING)
                .map(DtoMapper::toBooking)
                .toList();
    }

    public List<ApiDtos.BookingDto> todayDepartures() {
        LocalDate today = LocalDate.now();
        return bookingRepository.findDeparturesOnDate(today).stream()
                .filter(b -> b.getStatus() == BookingStatus.CHECKED_IN)
                .map(DtoMapper::toBooking)
                .toList();
    }

    public List<ApiDtos.BookingDto> checkoutQueue() {
        return bookingRepository.findCheckoutQueue().stream()
                .map(DtoMapper::toBooking)
                .toList();
    }

    public ApiDtos.CheckoutBillDto calculateCheckoutBill(String bookingCode) {
        Booking booking = findBooking(bookingCode);
        long roomCharges = booking.getAmountRwf();
        int serviceCount = countBillableServices(booking);
        long servicesRwf = serviceCount * SERVICE_CHARGE_RWF;
        long balanceDue = guestBalance(booking);
        if (balanceDue > servicesRwf && servicesRwf == 0) {
            servicesRwf = balanceDue;
        } else if (balanceDue > 0 && servicesRwf < balanceDue) {
            servicesRwf = balanceDue;
        }
        long total = roomCharges + servicesRwf;
        boolean canComplete = booking.isCheckoutRequested()
                && booking.isChargesVerified()
                && balanceDue == 0
                && booking.getStatus() == BookingStatus.CHECKED_IN;
        return new ApiDtos.CheckoutBillDto(
                booking.getBookingCode(),
                booking.getGuestName(),
                booking.getGuestEmail(),
                booking.getRoomLabel(),
                roomCharges,
                servicesRwf,
                total,
                balanceDue,
                serviceCount,
                booking.isCheckoutRequested(),
                booking.isChargesVerified(),
                booking.getInvoiceIssuedAt() != null,
                canComplete);
    }

    public List<ApiDtos.BookingDto> guestArrivalsToday() {
        LocalDate today = LocalDate.now();
        return bookingRepository.findArrivalsOnDate(today).stream()
                .filter(b -> b.isGuestArrived()
                        || b.getStatus() == BookingStatus.CONFIRMED
                        || b.getStatus() == BookingStatus.PENDING)
                .map(DtoMapper::toBooking)
                .toList();
    }

    @Transactional
    public ApiDtos.MessageResponse recordGuestArrival(String bookingCode) {
        UserAccount user = currentUser.requireUser();
        Booking booking = findBooking(bookingCode);
        if (booking.getGuestUser() == null || !booking.getGuestUser().getId().equals(user.getId())) {
            throw new IllegalArgumentException("Not your booking");
        }
        if (booking.getStatus() == BookingStatus.CANCELLED || booking.getStatus() == BookingStatus.CHECKED_OUT) {
            throw new IllegalArgumentException("Booking is not active");
        }
        booking.setGuestArrived(true);
        bookingRepository.save(booking);

        notifyUser(user, "Welcome to Net Luna Villa",
                "Front desk has been notified of your arrival for " + bookingCode + ".",
                NotificationCategory.BOOKING);

        for (UserAccount receptionist : userAccountRepository.findByRole(UserRole.RECEPTIONIST)) {
            notifyUser(receptionist, "Guest arrived",
                    booking.getGuestName() + " has arrived — " + bookingCode
                            + " · " + booking.getRoomLabel() + " · verify & check in",
                    NotificationCategory.BOOKING);
        }

        auditService.log(user.getEmail(), "Guest arrived at hotel: " + bookingCode);
        return new ApiDtos.MessageResponse("Reception notified — please proceed to the front desk");
    }

    @Transactional
    public ApiDtos.BookingDto receptionistCheckIn(String bookingCode, String roomNumber) {
        UserAccount actor = currentUser.requireUser();
        Booking booking = findBooking(bookingCode);

        if (booking.getStatus() != BookingStatus.CONFIRMED && booking.getStatus() != BookingStatus.PENDING) {
            throw new IllegalArgumentException("Booking is not eligible for check-in");
        }

        Room room = booking.getRoom();
        if (roomNumber != null && !roomNumber.isBlank()) {
            room = roomRepository.findByBranchId(booking.getBranch().getId()).stream()
                    .filter(r -> r.getRoomNumber().equals(roomNumber.trim()))
                    .findFirst()
                    .orElse(room);
        }
        if (room != null) {
            room.setAvailable(false);
            roomRepository.save(room);
            booking.setRoom(room);
            booking.setRoomLabel(room.getRoomType().name() + " " + room.getRoomNumber());
        }

        booking.setStatus(BookingStatus.CHECKED_IN);
        bookingRepository.save(booking);

        if (booking.getGuestUser() != null) {
            notifyUser(booking.getGuestUser(), "Checked in",
                    "Welcome! Room " + booking.getRoomLabel() + " is ready.",
                    NotificationCategory.BOOKING);
        }

        auditService.log(actor.getEmail(), "Check-in: " + bookingCode + " → " + booking.getRoomLabel()
                + " — guest checked in, room occupied");
        return DtoMapper.toBooking(booking);
    }

    @Transactional
    public ApiDtos.BookingDto receptionistCheckOut(String bookingCode) {
        UserAccount actor = currentUser.requireUser();
        requireFrontDesk(actor);
        Booking booking = findBooking(bookingCode);

        if (booking.getStatus() != BookingStatus.CHECKED_IN) {
            throw new IllegalArgumentException("Guest must be checked in before check-out");
        }
        if (!booking.isCheckoutRequested()) {
            throw new IllegalArgumentException("Guest must request check-out first");
        }
        if (!booking.isChargesVerified()) {
            throw new IllegalArgumentException("Reception must verify charges before check-out");
        }
        long balanceDue = guestBalance(booking);
        if (balanceDue > 0) {
            throw new IllegalArgumentException(
                    "Guest still owes RWF " + balanceDue + " — payment required before check-out");
        }

        if (booking.getInvoiceIssuedAt() == null) {
            booking.setInvoiceIssuedAt(Instant.now());
        }

        if (booking.getRoom() != null) {
            Room room = booking.getRoom();
            room.setAvailable(true);
            roomRepository.save(room);
        }

        booking.setStatus(BookingStatus.CHECKED_OUT);
        bookingRepository.save(booking);

        if (booking.getGuestUser() != null) {
            UserAccount guestUser = booking.getGuestUser();
            guestProfileRepository.findByUserId(guestUser.getId()).ifPresent(profile -> {
                profile.setVisitCount(profile.getVisitCount() + 1);
                guestProfileRepository.save(profile);
            });
            notifyUser(guestUser, "Checkout complete",
                    "Thank you for staying at Net Luna Villa. Your invoice for "
                            + booking.getBookingCode() + " is ready. Visit count updated.",
                    NotificationCategory.CHECKOUT);
        }

        auditService.log(actor.getEmail(),
                "Check-out: " + bookingCode + " — invoice issued, room released, guest history saved");
        return DtoMapper.toBooking(booking);
    }

    @Transactional
    public ApiDtos.CheckoutBillDto verifyCheckoutCharges(String bookingCode) {
        UserAccount actor = currentUser.requireUser();
        requireFrontDesk(actor);
        Booking booking = findBooking(bookingCode);
        if (booking.getStatus() != BookingStatus.CHECKED_IN) {
            throw new IllegalArgumentException("Guest must be checked in");
        }
        if (!booking.isCheckoutRequested()) {
            throw new IllegalArgumentException("Guest has not requested check-out yet");
        }
        booking.setChargesVerified(true);
        bookingRepository.save(booking);

        ApiDtos.CheckoutBillDto bill = calculateCheckoutBill(bookingCode);
        if (booking.getGuestUser() != null) {
            notifyUser(booking.getGuestUser(), "Charges verified",
                    "Reception verified your bill for " + bookingCode
                            + ". Total RWF " + bill.totalRwf()
                            + (bill.balanceDueRwf() > 0
                                    ? " — please pay RWF " + bill.balanceDueRwf() + " to complete checkout."
                                    : " — ready for departure."),
                    NotificationCategory.CHECKOUT);
        }
        auditService.log(actor.getEmail(),
                "Checkout charges verified: " + bookingCode + " — total RWF " + bill.totalRwf());
        return bill;
    }

    @Transactional
    public ApiDtos.InvoiceDto issueInvoice(String bookingCode) {
        UserAccount actor = currentUser.requireUser();
        Booking booking = findBooking(bookingCode);
        if (booking.getStatus() != BookingStatus.CHECKED_IN && booking.getStatus() != BookingStatus.CHECKED_OUT) {
            throw new IllegalArgumentException("Invoice only available for active or completed stays");
        }
        if (!booking.isChargesVerified()) {
            throw new IllegalArgumentException("Charges must be verified before generating invoice");
        }
        long balanceDue = guestBalance(booking);
        if (balanceDue > 0 && booking.getStatus() == BookingStatus.CHECKED_IN) {
            throw new IllegalArgumentException("Guest must settle balance before invoice is issued");
        }
        if (booking.getInvoiceIssuedAt() == null) {
            booking.setInvoiceIssuedAt(Instant.now());
            bookingRepository.save(booking);
            auditService.log(actor.getEmail(), "Invoice generated: " + bookingCode);
        }
        return generateInvoice(bookingCode);
    }

    private Booking findBooking(String code) {
        return bookingRepository.findAll().stream()
                .filter(b -> b.getBookingCode().equals(code))
                .findFirst()
                .orElseThrow(() -> new IllegalArgumentException("Booking not found: " + code));
    }

    @Transactional
    public ApiDtos.MessageResponse guestRequestCheckout(String bookingCode) {
        UserAccount user = currentUser.requireUser();
        Booking booking = findBooking(bookingCode);
        if (booking.getGuestUser() == null || !booking.getGuestUser().getId().equals(user.getId())) {
            throw new IllegalArgumentException("Not your booking");
        }
        if (booking.getStatus() != BookingStatus.CHECKED_IN) {
            throw new IllegalArgumentException("You must be checked in to request checkout");
        }
        booking.setCheckoutRequested(true);
        bookingRepository.save(booking);

        ApiDtos.CheckoutBillDto bill = calculateCheckoutBill(bookingCode);

        notifyUser(user, "Checkout requested",
                "Your check-out request for " + bookingCode + " was sent to reception. "
                        + "Estimated total: RWF " + bill.totalRwf(),
                NotificationCategory.CHECKOUT);

        for (UserAccount receptionist : userAccountRepository.findByRole(UserRole.RECEPTIONIST)) {
            notifyUser(receptionist, "Guest checkout request",
                    booking.getGuestName() + " — " + bookingCode + " · Room " + booking.getRoomLabel()
                            + " · Total RWF " + bill.totalRwf(),
                    NotificationCategory.CHECKOUT);
        }

        auditService.log(user.getEmail(),
                "Guest requested checkout: " + bookingCode + " — bill calculated RWF " + bill.totalRwf());
        return new ApiDtos.MessageResponse(
                "Check-out request sent. Total bill: RWF " + bill.totalRwf()
                        + (bill.balanceDueRwf() > 0 ? " — balance due RWF " + bill.balanceDueRwf() : ""));
    }

    public ApiDtos.InvoiceDto generateInvoice(String bookingCode) {
        Booking booking = findBooking(bookingCode);
        ApiDtos.CheckoutBillDto bill = calculateCheckoutBill(bookingCode);
        String issued = booking.getInvoiceIssuedAt() != null
                ? DateTimeFormatter.ISO_INSTANT.format(booking.getInvoiceIssuedAt())
                : DateTimeFormatter.ISO_INSTANT.format(Instant.now());
        return new ApiDtos.InvoiceDto(
                booking.getBookingCode(),
                booking.getGuestName(),
                booking.getGuestEmail(),
                booking.getRoomLabel(),
                bill.roomChargesRwf(),
                bill.servicesRwf(),
                bill.totalRwf(),
                bill.balanceDueRwf(),
                issued);
    }

    private int countBillableServices(Booking booking) {
        if (booking.getGuestUser() == null) {
            return 0;
        }
        return (int) serviceRequestRepository.findByGuestUserIdOrderByCreatedAtDesc(booking.getGuestUser().getId())
                .stream()
                .filter(s -> s.getStatus() == ServiceStatus.COMPLETED
                        || s.getStatus() == ServiceStatus.IN_PROGRESS)
                .count();
    }

    private long guestBalance(Booking booking) {
        if (booking.getGuestUser() == null) {
            return 0;
        }
        return guestProfileRepository.findByUserId(booking.getGuestUser().getId())
                .map(GuestProfile::getBalanceRwf)
                .orElse(0L);
    }

    private void requireFrontDesk(UserAccount user) {
        if (user.getRole() != UserRole.RECEPTIONIST
                && user.getRole() != UserRole.ADMIN
                && user.getRole() != UserRole.MANAGEMENT) {
            throw new IllegalArgumentException("Front desk access required");
        }
    }

    private void notifyUser(UserAccount user, String title, String body, NotificationCategory cat) {
        Notification n = new Notification();
        n.setUser(user);
        n.setTitle(title);
        n.setBody(body);
        n.setCategory(cat);
        n.setRead(false);
        notificationRepository.save(n);
    }
}
