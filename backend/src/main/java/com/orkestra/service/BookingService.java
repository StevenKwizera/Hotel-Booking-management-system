package com.orkestra.service;

import com.orkestra.domain.entity.*;
import com.orkestra.domain.enums.BookingStatus;
import com.orkestra.domain.enums.NotificationCategory;
import com.orkestra.domain.enums.PaymentMethod;
import com.orkestra.domain.enums.PaymentStatus;
import com.orkestra.domain.enums.RoomType;
import com.orkestra.domain.enums.UserRole;
import com.orkestra.dto.ApiDtos;
import com.orkestra.repository.*;
import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class BookingService {

    private final BookingRepository bookingRepository;
    private final BranchRepository branchRepository;
    private final RoomRepository roomRepository;
    private final NotificationRepository notificationRepository;
    private final GuestProfileRepository guestProfileRepository;
    private final AuditService auditService;
    private final PersonalizationService personalizationService;
    private final CurrentUserService currentUser;
    private final EmailService emailService;
    private final PaymentRepository paymentRepository;
    private final PaypackService paypackService;
    private final BookingPaymentService bookingPaymentService;
    private final PaypackPaymentSyncService paypackPaymentSyncService;
    private final UserAccountRepository userAccountRepository;
    private final BookingDiscountService bookingDiscountService;

    public BookingService(
            BookingRepository bookingRepository,
            BranchRepository branchRepository,
            RoomRepository roomRepository,
            NotificationRepository notificationRepository,
            GuestProfileRepository guestProfileRepository,
            AuditService auditService,
            PersonalizationService personalizationService,
            CurrentUserService currentUser,
            EmailService emailService,
            PaymentRepository paymentRepository,
            PaypackService paypackService,
            BookingPaymentService bookingPaymentService,
            PaypackPaymentSyncService paypackPaymentSyncService,
            UserAccountRepository userAccountRepository,
            BookingDiscountService bookingDiscountService) {
        this.bookingRepository = bookingRepository;
        this.branchRepository = branchRepository;
        this.roomRepository = roomRepository;
        this.notificationRepository = notificationRepository;
        this.guestProfileRepository = guestProfileRepository;
        this.auditService = auditService;
        this.personalizationService = personalizationService;
        this.currentUser = currentUser;
        this.emailService = emailService;
        this.paymentRepository = paymentRepository;
        this.paypackService = paypackService;
        this.bookingPaymentService = bookingPaymentService;
        this.paypackPaymentSyncService = paypackPaymentSyncService;
        this.userAccountRepository = userAccountRepository;
        this.bookingDiscountService = bookingDiscountService;
    }

    public List<ApiDtos.BookingDto> list() {
        UserAccount user = currentUser.requireUser();
        if (user.getRole() == UserRole.GUEST) {
            paypackPaymentSyncService.syncPendingForUser(user.getId());
        }
        List<Booking> bookings = user.getRole() == UserRole.GUEST
                ? bookingRepository.findByGuestUserIdOrderByCreatedAtDesc(user.getId())
                : bookingRepository.findAllByOrderByCreatedAtDesc();
        return bookings.stream().map(DtoMapper::toBooking).toList();
    }

    public ApiDtos.AvailabilityDto availability() {
        Branch branch = branchRepository.findByCode("KIGALI")
                .orElseThrow(() -> new IllegalArgumentException("Branch not found"));
        long available = roomRepository.countByBranchIdAndAvailableTrue(branch.getId());
        int total = branch.getTotalRooms();
        return new ApiDtos.AvailabilityDto((int) available, total);
    }

    public ApiDtos.RoomSearchResultDto searchRooms(
            String checkInStr, String checkOutStr, String roomTypeFilter, boolean availableOnly) {
        Branch branch = branchRepository.findByCode("KIGALI")
                .orElseThrow(() -> new IllegalArgumentException("Branch not found"));
        LocalDate checkIn = checkInStr != null && !checkInStr.isBlank()
                ? LocalDate.parse(checkInStr)
                : LocalDate.now();
        LocalDate checkOut = checkOutStr != null && !checkOutStr.isBlank()
                ? LocalDate.parse(checkOutStr)
                : checkIn.plusDays(1);
        if (checkInStr != null && !checkInStr.isBlank()) {
            BookingValidation.validateGuestStayDates(checkIn, checkOut);
        } else if (!checkOut.isAfter(checkIn)) {
            throw new IllegalArgumentException("Check-out must be after check-in");
        }

        RoomType filterType = null;
        if (roomTypeFilter != null
                && !roomTypeFilter.isBlank()
                && !roomTypeFilter.equalsIgnoreCase("all")) {
            filterType = DtoMapper.parseRoomType(roomTypeFilter);
        }

        long nights = ChronoUnit.DAYS.between(checkIn, checkOut);

        List<Room> rooms = roomRepository.findByBranchId(branch.getId()).stream()
                .sorted(Comparator.comparing(Room::getRoomNumber))
                .toList();

        List<ApiDtos.RoomListingDto> listings = new ArrayList<>();
        int availableCount = 0;
        int totalCount = 0;
        for (Room room : rooms) {
            if (filterType != null && room.getRoomType() != filterType) {
                continue;
            }
            totalCount++;
            boolean freeForDates = !bookingRepository.existsOverlappingBooking(
                    room.getId(), checkIn, checkOut);
            boolean physicallyAvailable = room.isAvailable();
            boolean availableForDates = freeForDates && physicallyAvailable;

            String status;
            String statusLabel;
            if (availableForDates) {
                status = "AVAILABLE";
                statusLabel = "Available — you can book";
                availableCount++;
            } else if (!freeForDates) {
                status = "BOOKED";
                statusLabel = "Booked for your dates";
            } else {
                status = "OCCUPIED";
                statusLabel = "Occupied — guest in house";
            }

            if (availableOnly && !availableForDates) {
                continue;
            }

            long nightly = rateFor(room.getRoomType());
            var profile = RoomCatalog.profileFor(room.getRoomType());

            listings.add(new ApiDtos.RoomListingDto(
                    room.getRoomNumber(),
                    DtoMapper.capitalizeRoomType(room.getRoomType()),
                    nightly,
                    availableForDates,
                    status,
                    statusLabel,
                    profile.description(),
                    profile.amenities(),
                    profile.maxGuests(),
                    profile.bedType(),
                    profile.sizeSqm(),
                    RoomCatalog.floorLabel(room.getRoomNumber()),
                    nightly * nights));
        }

        return new ApiDtos.RoomSearchResultDto(
                listings,
                availableCount,
                totalCount,
                checkIn.toString(),
                checkOut.toString());
    }

    public ApiDtos.BookingQuoteDto quote(
            String checkInStr, String checkOutStr, String roomTypeStr, String roomNumber, int guestCount) {
        if (roomNumber == null || roomNumber.isBlank()) {
            throw new IllegalArgumentException("Room number is required for quote");
        }
        LocalDate checkIn = LocalDate.parse(checkInStr);
        LocalDate checkOut = LocalDate.parse(checkOutStr);
        BookingValidation.validateGuestStayDates(checkIn, checkOut);
        BookingValidation.validateGuestCount(guestCount);
        RoomType roomType = DtoMapper.parseRoomType(roomTypeStr);
        Branch branch = branchRepository.findByCode("KIGALI")
                .orElseThrow(() -> new IllegalArgumentException("Branch not found"));
        long nights = ChronoUnit.DAYS.between(checkIn, checkOut);
        Room room = resolveRoom(branch, roomType, checkIn, checkOut, roomNumber);
        long nightly = rateFor(room.getRoomType());
        long gross = nightly * nights;
        UserAccount user = currentUser.requireUser();
        UserAccount pricingGuest = user.getRole() == UserRole.GUEST ? user : null;
        BookingDiscountService.Result pricing =
                bookingDiscountService.calculate(gross, checkIn, pricingGuest);
        return new ApiDtos.BookingQuoteDto(
                room.getRoomNumber(),
                DtoMapper.capitalizeRoomType(room.getRoomType()),
                checkIn.toString(),
                checkOut.toString(),
                (int) nights,
                guestCount,
                nightly,
                pricing.grossRwf(),
                pricing.discountRwf(),
                pricing.payableRwf(),
                pricing.earlyBookingApplied(),
                pricing.repeatGuestApplied(),
                true);
    }

    @Transactional
    public ApiDtos.BookingDto requestBooking(ApiDtos.RequestBookingRequest req) {
        UserAccount user = currentUser.requireUser();
        if (user.getRole() != UserRole.GUEST) {
            throw new IllegalArgumentException("Only guests can submit online booking requests");
        }
        Booking booking = buildGuestBooking(user, req.checkIn(), req.checkOut(), req.roomType(), req.guestCount(),
                req.roomNumber(), user.getName(), user.getEmail());
        booking.setStatus(BookingStatus.PENDING);
        booking = bookingRepository.save(booking);

        notify(user, "Booking request submitted",
                booking.getRoomLabel() + " · " + booking.getCheckIn() + " to " + booking.getCheckOut()
                        + " — " + formatPayableWithDiscount(booking) + " (awaiting reception approval)",
                NotificationCategory.BOOKING);

        notifyStaffNewBooking(booking);

        auditService.log(user.getEmail(),
                "Booking request: " + booking.getBookingCode() + " — awaiting approval");
        personalizationService.refreshForGuest(user);

        return DtoMapper.toBooking(booking);
    }

    @Transactional
    public ApiDtos.BookingDto approveBooking(String bookingCode) {
        UserAccount actor = requireFrontDesk();
        Booking booking = findBooking(bookingCode);
        if (booking.getStatus() != BookingStatus.PENDING) {
            throw new IllegalArgumentException("Only pending bookings can be approved");
        }
        booking.setStatus(BookingStatus.APPROVED);
        Booking approved = bookingRepository.save(booking);

        UserAccount guest = approved.getGuestUser();
        if (guest != null) {
            guestProfileRepository.findByUserId(guest.getId()).ifPresent(profile -> {
                profile.setBalanceRwf(profile.getBalanceRwf() + approved.getAmountRwf());
                guestProfileRepository.save(profile);
            });
            long payAmount = paypackService.resolveChargeAmount(approved.getAmountRwf());
            notify(guest, "Booking approved — ready to pay",
                    approved.getBookingCode() + " for " + approved.getRoomLabel() + " ("
                            + approved.getCheckIn() + " to " + approved.getCheckOut()
                            + ") was approved. Open Reservations and tap Continue with payment (Paypack MoMo, RWF "
                            + payAmount + " test charge).",
                    NotificationCategory.BOOKING);
        }

        auditService.log(actor.getEmail(), "Approved booking: " + bookingCode);
        return DtoMapper.toBooking(approved);
    }

    @Transactional
    public ApiDtos.BookingDto rejectBooking(String bookingCode, String reason) {
        UserAccount actor = requireFrontDesk();
        Booking booking = findBooking(bookingCode);
        if (booking.getStatus() != BookingStatus.PENDING) {
            throw new IllegalArgumentException("Only pending bookings can be rejected");
        }
        if (reason == null || reason.isBlank()) {
            throw new IllegalArgumentException("A rejection reason is required for the guest");
        }
        booking.setStatus(BookingStatus.CANCELLED);
        booking = bookingRepository.save(booking);

        UserAccount guest = booking.getGuestUser();
        if (guest != null) {
            String msg = booking.getBookingCode() + " for " + booking.getRoomLabel() + " ("
                    + booking.getCheckIn() + " to " + booking.getCheckOut() + ") was not approved. Reason: "
                    + reason.trim();
            notify(guest, "Booking not approved", msg, NotificationCategory.BOOKING);
        }

        auditService.log(actor.getEmail(), "Rejected booking: " + bookingCode + " — " + reason.trim());
        return DtoMapper.toBooking(booking);
    }

    @Transactional
    public ApiDtos.PaypackPaymentInitDto payApprovedBookingWithPaypack(
            String bookingCode, ApiDtos.PaypackBookingPaymentRequest req) {
        UserAccount user = currentUser.requireUser();
        if (user.getRole() != UserRole.GUEST) {
            throw new IllegalArgumentException("Only guests can pay for their booking");
        }
        Booking booking = findBooking(bookingCode);
        if (booking.getGuestUser() == null || !booking.getGuestUser().getId().equals(user.getId())) {
            throw new IllegalArgumentException("Not your booking");
        }
        if (booking.getStatus() != BookingStatus.APPROVED) {
            throw new IllegalArgumentException("Booking must be approved before payment");
        }

        long chargeAmount = paypackService.resolveChargeAmount(booking.getAmountRwf());
        PaypackService.CashinResult cashin = paypackService.cashin(chargeAmount, req.phoneNumber());
        String receiptEmail = resolveConfirmationEmail(req.confirmationEmail());

        Payment payment = new Payment();
        payment.setPaymentCode("PAY-" + System.currentTimeMillis() % 100000);
        payment.setGuestUser(user);
        payment.setGuestName(user.getName());
        payment.setBooking(booking);
        payment.setAmountRwf(chargeAmount);
        payment.setMethod(PaymentMethod.PAYPACK);
        payment.setStatus(PaymentStatus.PENDING);
        payment.setIremboReference(paypackService.paypackReference(cashin.ref()));
        payment.setConfirmationEmail(receiptEmail);
        payment = paymentRepository.saveAndFlush(payment);

        if (cashin.simulated()) {
            bookingPaymentService.simulateCompleteIfNeeded(payment);
        }

        String message = cashin.simulated()
                ? "Test payment simulated — booking confirmed."
                : "Approve the MoMo prompt on " + PaypackService.normalizePhone(req.phoneNumber())
                        + ". Payment RWF " + chargeAmount + " will be sent to merchant "
                        + paypackService.merchantPhonesDisplay() + ".";

        auditService.log(user.getEmail(),
                "Paypack payment initiated for " + bookingCode + " — RWF " + chargeAmount);

        return new ApiDtos.PaypackPaymentInitDto(
                payment.getPaymentCode(),
                cashin.ref(),
                chargeAmount,
                booking.getAmountRwf(),
                cashin.status(),
                message,
                paypackService.resolveChargeAmount(booking.getAmountRwf()) != booking.getAmountRwf());
    }

    @Transactional
    public ApiDtos.PaymentDto syncPaypackPayment(String paymentCode) {
        UserAccount user = currentUser.requireUser();
        Payment payment = paymentRepository.findAll().stream()
                .filter(p -> p.getPaymentCode().equals(paymentCode))
                .findFirst()
                .orElseThrow(() -> new IllegalArgumentException("Payment not found"));
        if (user.getRole() == UserRole.GUEST
                && payment.getGuestUser() != null
                && !payment.getGuestUser().getId().equals(user.getId())) {
            throw new IllegalArgumentException("Not your payment");
        }
        if (payment.getStatus() == PaymentStatus.PENDING && payment.getIremboReference() != null
                && payment.getIremboReference().startsWith("PAYPACK-")) {
            String ref = payment.getIremboReference().substring("PAYPACK-".length());
            String status = paypackService.resolveTransactionStatus(ref);
            if (paypackService.isSuccessfulStatus(status)) {
                bookingPaymentService.completePaypackPayment(ref, payment.getAmountRwf(), status);
                payment = paymentRepository.findByIremboReference(payment.getIremboReference())
                        .orElse(payment);
            }
        }
        return DtoMapper.toPayment(payment);
    }

    private Booking buildGuestBooking(
            UserAccount guestUser,
            String checkInStr,
            String checkOutStr,
            String roomTypeStr,
            int guestCount,
            String roomNumber,
            String guestName,
            String guestEmail) {
        LocalDate checkIn = LocalDate.parse(checkInStr);
        LocalDate checkOut = LocalDate.parse(checkOutStr);
        BookingValidation.validateGuestStayDates(checkIn, checkOut);
        BookingValidation.validateGuestCount(guestCount);
        RoomType roomType = DtoMapper.parseRoomType(roomTypeStr);
        Branch branch = branchRepository.findByCode("KIGALI")
                .orElseThrow(() -> new IllegalArgumentException("Branch not found"));
        long nights = ChronoUnit.DAYS.between(checkIn, checkOut);
        Room room = resolveRoom(branch, roomType, checkIn, checkOut, roomNumber);
        long rate = rateFor(room.getRoomType());
        long gross = rate * nights;
        BookingDiscountService.Result pricing =
                bookingDiscountService.calculate(gross, checkIn, guestUser);

        Booking booking = new Booking();
        booking.setBookingCode("BK-" + System.currentTimeMillis() % 100000);
        booking.setGuestUser(guestUser);
        booking.setGuestName(guestName);
        booking.setGuestEmail(guestEmail);
        booking.setRoom(room);
        booking.setRoomLabel(room.getRoomType().name() + " " + room.getRoomNumber());
        booking.setRoomType(room.getRoomType());
        booking.setGuestCount(guestCount);
        booking.setCheckIn(checkIn);
        booking.setCheckOut(checkOut);
        booking.setGrossAmountRwf(pricing.grossRwf());
        booking.setDiscountRwf(pricing.discountRwf());
        booking.setEarlyBookingDiscount(pricing.earlyBookingApplied());
        booking.setRepeatGuestDiscount(pricing.repeatGuestApplied());
        booking.setAmountRwf(pricing.payableRwf());
        booking.setBranch(branch);
        return booking;
    }

    private static String formatPayableWithDiscount(Booking booking) {
        if (booking.getDiscountRwf() > 0) {
            return "RWF " + booking.getAmountRwf() + " after discount (was RWF "
                    + booking.getGrossAmountRwf() + ", saved RWF " + booking.getDiscountRwf() + ")";
        }
        return "RWF " + booking.getAmountRwf();
    }

    private void notifyStaffNewBooking(Booking booking) {
        String body = booking.getGuestName() + " requested " + booking.getRoomLabel() + " · "
                + booking.getCheckIn() + " to " + booking.getCheckOut() + " — "
                + formatPayableWithDiscount(booking) + " (" + booking.getBookingCode() + ")";
        for (UserRole role : List.of(UserRole.RECEPTIONIST, UserRole.MANAGEMENT, UserRole.ADMIN)) {
            for (UserAccount staff : userAccountRepository.findByRole(role)) {
                notify(staff, "New booking request", body, NotificationCategory.BOOKING);
            }
        }
    }

    @Transactional
    public ApiDtos.BookingConfirmationDto bookAndPay(ApiDtos.BookWithPaymentRequest req) {
        ApiDtos.BookingDto booking = requestBooking(new ApiDtos.RequestBookingRequest(
                req.checkIn(), req.checkOut(), req.roomType(), req.guestCount(), req.roomNumber()));
        return new ApiDtos.BookingConfirmationDto(
                booking,
                null,
                "Booking " + booking.id() + " submitted — reception will approve, then you can pay via Paypack MoMo.");
    }

    @Transactional
    public ApiDtos.BookingDto create(ApiDtos.CreateBookingRequest req) {
        UserAccount user = currentUser.requireUser();
        if (user.getRole() == UserRole.GUEST) {
            return requestBooking(new ApiDtos.RequestBookingRequest(
                    req.checkIn(), req.checkOut(), req.roomType(), req.guestCount(), req.roomNumber()));
        }

        LocalDate checkIn = LocalDate.parse(req.checkIn());
        LocalDate checkOut = LocalDate.parse(req.checkOut());
        BookingValidation.validateGuestCount(req.guestCount());
        if (user.getRole() == UserRole.GUEST) {
            BookingValidation.validateGuestStayDates(checkIn, checkOut);
        } else if (!checkOut.isAfter(checkIn)) {
            throw new IllegalArgumentException("Check-out must be after check-in");
        }
        RoomType roomType = DtoMapper.parseRoomType(req.roomType());
        Branch branch = branchRepository.findByCode("KIGALI")
                .orElseThrow(() -> new IllegalArgumentException("Branch not found"));

        long nights = ChronoUnit.DAYS.between(checkIn, checkOut);

        Room room = resolveRoom(branch, roomType, checkIn, checkOut, req.roomNumber());
        long rate = rateFor(room != null ? room.getRoomType() : roomType);
        long amount = rate * nights;

        UserAccount guestUser = user;
        String guestName = req.guestName() != null ? req.guestName() : user.getName();
        String guestEmail = user.getEmail();
        if (user.getRole() != UserRole.GUEST && req.guestEmail() != null && !req.guestEmail().isBlank()) {
            guestEmail = req.guestEmail().trim().toLowerCase();
            final String lookupEmail = guestEmail;
            guestUser = currentUser.findUserByEmail(lookupEmail)
                    .orElseThrow(() -> new IllegalArgumentException("Guest not found: " + lookupEmail));
            guestName = req.guestName() != null ? req.guestName() : guestUser.getName();
        }

        Booking booking = new Booking();
        booking.setBookingCode("BK-" + System.currentTimeMillis() % 100000);
        booking.setGuestUser(user.getRole() == UserRole.GUEST ? user : guestUser);
        booking.setGuestName(guestName);
        booking.setGuestEmail(guestEmail);
        booking.setRoom(room);
        booking.setRoomLabel(room != null ? room.getRoomType().name() + " " + room.getRoomNumber() : roomType.name());
        booking.setRoomType(room != null ? room.getRoomType() : roomType);
        booking.setGuestCount(req.guestCount());
        booking.setCheckIn(checkIn);
        booking.setCheckOut(checkOut);
        booking.setStatus(BookingStatus.CONFIRMED);
        booking.setAmountRwf(amount);
        booking.setBranch(branch);
        booking = bookingRepository.save(booking);

        UserAccount notifyUser = user.getRole() == UserRole.GUEST ? user : guestUser;
        guestProfileRepository.findByUserId(guestUser.getId()).ifPresent(profile -> {
            profile.setBalanceRwf(profile.getBalanceRwf() + amount);
            guestProfileRepository.save(profile);
        });

        notify(notifyUser, "Booking confirmed",
                booking.getRoomLabel() + " · " + checkIn + " to " + checkOut
                        + " — RWF " + amount + " added to balance. Pay via Payments module.",
                NotificationCategory.BOOKING);

        auditService.log(user.getEmail(),
                "Booking flow: " + booking.getBookingCode() + " created for " + guestEmail);

        if (guestUser.getRole() == UserRole.GUEST) {
            personalizationService.refreshForGuest(guestUser);
        }

        emailService.sendBookingConfirmation(
                guestEmail,
                guestName,
                booking.getBookingCode(),
                booking.getRoomLabel() + " · " + checkIn + " to " + checkOut + " · RWF " + amount);

        return DtoMapper.toBooking(booking);
    }

    @Transactional
    public ApiDtos.BookingDto update(String bookingCode, ApiDtos.UpdateBookingRequest req) {
        UserAccount user = currentUser.requireUser();
        Booking booking = findBooking(bookingCode);
        if (booking.getStatus() == BookingStatus.CANCELLED || booking.getStatus() == BookingStatus.CHECKED_OUT) {
            throw new IllegalArgumentException("Cannot modify this booking");
        }
        if (user.getRole() == UserRole.GUEST
                && booking.getGuestUser() != null
                && !booking.getGuestUser().getId().equals(user.getId())) {
            throw new IllegalArgumentException("Not your booking");
        }
        if (req.checkIn() != null && !req.checkIn().isBlank()) {
            booking.setCheckIn(LocalDate.parse(req.checkIn()));
        }
        if (req.checkOut() != null && !req.checkOut().isBlank()) {
            booking.setCheckOut(LocalDate.parse(req.checkOut()));
        }
        if (req.guestCount() != null && req.guestCount() > 0) {
            BookingValidation.validateGuestCount(req.guestCount());
            booking.setGuestCount(req.guestCount());
        }
        if (user.getRole() == UserRole.GUEST) {
            BookingValidation.validateGuestStayDates(booking.getCheckIn(), booking.getCheckOut());
        } else if (!booking.getCheckOut().isAfter(booking.getCheckIn())) {
            throw new IllegalArgumentException("Check-out must be after check-in");
        }
        if (booking.getCheckOut().isAfter(booking.getCheckIn())) {
            long nights = ChronoUnit.DAYS.between(booking.getCheckIn(), booking.getCheckOut());
            booking.setAmountRwf(rateFor(booking.getRoomType()) * nights);
        }
        booking = bookingRepository.save(booking);
        auditService.log(user.getEmail(), "Booking updated: " + bookingCode);
        return DtoMapper.toBooking(booking);
    }

    @Transactional
    public ApiDtos.BookingDto verifyReservation(String bookingCode) {
        UserAccount actor = requireFrontDesk();
        Booking booking = findBooking(bookingCode);
        if (booking.getStatus() == BookingStatus.CANCELLED || booking.getStatus() == BookingStatus.CHECKED_OUT) {
            throw new IllegalArgumentException("Cannot verify this booking");
        }
        if (booking.getStatus() == BookingStatus.PENDING) {
            booking.setStatus(BookingStatus.CONFIRMED);
            booking = bookingRepository.save(booking);
        }
        auditService.log(actor.getEmail(),
                "Reservation verified: " + bookingCode + " — " + booking.getGuestName()
                        + " · " + booking.getRoomLabel() + " · " + booking.getCheckIn()
                        + " to " + booking.getCheckOut());
        return DtoMapper.toBooking(booking);
    }

    private UserAccount requireFrontDesk() {
        UserAccount user = currentUser.requireUser();
        if (user.getRole() != UserRole.RECEPTIONIST
                && user.getRole() != UserRole.ADMIN
                && user.getRole() != UserRole.MANAGEMENT) {
            throw new IllegalArgumentException("Front desk access required");
        }
        return user;
    }

    @Transactional
    public ApiDtos.BookingDto cancel(String bookingCode) {
        Booking booking = bookingRepository.findAll().stream()
                .filter(b -> b.getBookingCode().equals(bookingCode))
                .findFirst()
                .orElseThrow(() -> new IllegalArgumentException("Booking not found"));
        booking.setStatus(BookingStatus.CANCELLED);
        bookingRepository.save(booking);
        return DtoMapper.toBooking(booking);
    }

    @Transactional
    public ApiDtos.BookingDto checkIn(String bookingCode) {
        Booking booking = findBooking(bookingCode);
        booking.setStatus(BookingStatus.CHECKED_IN);
        return DtoMapper.toBooking(bookingRepository.save(booking));
    }

    @Transactional
    public ApiDtos.BookingDto checkOut(String bookingCode) {
        Booking booking = findBooking(bookingCode);
        booking.setStatus(BookingStatus.CHECKED_OUT);
        return DtoMapper.toBooking(bookingRepository.save(booking));
    }

    private Booking findBooking(String code) {
        return bookingRepository.findAll().stream()
                .filter(b -> b.getBookingCode().equals(code))
                .findFirst()
                .orElseThrow(() -> new IllegalArgumentException("Booking not found"));
    }

    private Room resolveRoom(
            Branch branch, RoomType roomType, LocalDate checkIn, LocalDate checkOut, String roomNumber) {
        if (roomNumber != null && !roomNumber.isBlank()) {
            Room room = roomRepository.findByBranchId(branch.getId()).stream()
                    .filter(r -> r.getRoomNumber().equals(roomNumber.trim()))
                    .findFirst()
                    .orElseThrow(() -> new IllegalArgumentException("Room not found: " + roomNumber));
            if (!room.isAvailable()) {
                throw new IllegalArgumentException("Room " + roomNumber + " is not available");
            }
            if (bookingRepository.existsOverlappingBooking(room.getId(), checkIn, checkOut)) {
                throw new IllegalArgumentException("Room " + roomNumber + " is already booked for these dates");
            }
            return room;
        }
        return roomRepository.findByBranchId(branch.getId()).stream()
                .filter(Room::isAvailable)
                .filter(r -> r.getRoomType() == roomType)
                .filter(r -> !bookingRepository.existsOverlappingBooking(r.getId(), checkIn, checkOut))
                .findFirst()
                .orElse(null);
    }

    private long rateFor(RoomType type) {
        return RoomRates.rateFor(type);
    }

    private void notify(UserAccount user, String title, String body, NotificationCategory cat) {
        Notification n = new Notification();
        n.setUser(user);
        n.setTitle(title);
        n.setBody(body);
        n.setCategory(cat);
        n.setRead(false);
        notificationRepository.save(n);
    }

    private String resolveConfirmationEmail(String requested) {
        String email = requested != null ? requested.trim().toLowerCase() : "";
        if (email.isBlank() || !email.matches("^[a-z0-9._%+\\-]+@[a-z0-9.\\-]+\\.[a-z]{2,}$")) {
            throw new IllegalArgumentException(
                    "Enter the email where you want your payment confirmation sent");
        }
        return email;
    }
}
