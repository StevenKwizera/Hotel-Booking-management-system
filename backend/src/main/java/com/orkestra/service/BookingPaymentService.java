package com.orkestra.service;

import com.orkestra.domain.entity.Booking;
import com.orkestra.domain.entity.Notification;
import com.orkestra.domain.entity.Payment;
import com.orkestra.domain.entity.UserAccount;
import com.orkestra.domain.enums.BookingStatus;
import com.orkestra.domain.enums.NotificationCategory;
import com.orkestra.domain.enums.PaymentMethod;
import com.orkestra.domain.enums.PaymentStatus;
import com.orkestra.repository.BookingRepository;
import com.orkestra.repository.GuestProfileRepository;
import com.orkestra.repository.NotificationRepository;
import com.orkestra.repository.PaymentRepository;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.context.annotation.Lazy;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class BookingPaymentService {

    private static final Logger log = LoggerFactory.getLogger(BookingPaymentService.class);
    private static final ZoneId KIGALI = ZoneId.of("Africa/Kigali");
    private static final DateTimeFormatter PAID_AT_FMT =
            DateTimeFormatter.ofPattern("dd MMM yyyy, HH:mm").withZone(KIGALI);

    private final PaymentRepository paymentRepository;
    private final BookingRepository bookingRepository;
    private final GuestProfileRepository guestProfileRepository;
    private final NotificationRepository notificationRepository;
    private final EmailService emailService;
    private final PersonalizationService personalizationService;
    private final AuditService auditService;
    private final PaypackService paypackService;
    private final MealOrderService mealOrderService;

    public BookingPaymentService(
            PaymentRepository paymentRepository,
            BookingRepository bookingRepository,
            GuestProfileRepository guestProfileRepository,
            NotificationRepository notificationRepository,
            EmailService emailService,
            PersonalizationService personalizationService,
            AuditService auditService,
            PaypackService paypackService,
            @Lazy MealOrderService mealOrderService) {
        this.paymentRepository = paymentRepository;
        this.bookingRepository = bookingRepository;
        this.guestProfileRepository = guestProfileRepository;
        this.notificationRepository = notificationRepository;
        this.emailService = emailService;
        this.personalizationService = personalizationService;
        this.auditService = auditService;
        this.paypackService = paypackService;
        this.mealOrderService = mealOrderService;
    }

    @Transactional
    public void completePaypackPayment(String paypackRef, long amountPaid, String paypackStatus) {
        if (!paypackService.isSuccessfulStatus(paypackStatus)) {
            return;
        }
        String storedRef = paypackService.paypackReference(paypackRef);
        Payment payment = paymentRepository.findByIremboReference(storedRef)
                .orElse(null);
        if (payment == null) {
            log.warn("No payment found for Paypack ref {}", paypackRef);
            return;
        }
        payment = paymentRepository.findById(payment.getId()).orElse(payment);
        if (payment.getStatus() == PaymentStatus.COMPLETED) {
            return;
        }
        if (payment.getMealOrder() != null) {
            mealOrderService.completeMealPayment(payment.getPaymentCode(), amountPaid, paypackStatus);
            return;
        }

        payment.setStatus(PaymentStatus.COMPLETED);
        payment.setFinanceVerified(true);
        paymentRepository.save(payment);

        Booking booking = payment.getBooking();
        if (booking != null && booking.getStatus() == BookingStatus.APPROVED) {
            booking.setStatus(BookingStatus.CONFIRMED);
            bookingRepository.save(booking);
        }

        UserAccount guest = payment.getGuestUser();
        if (guest != null) {
            guestProfileRepository.findByUserId(guest.getId()).ifPresent(profile -> {
                profile.setBalanceRwf(Math.max(0, profile.getBalanceRwf() - amountPaid));
                guestProfileRepository.save(profile);
            });

            String bookingCode = booking != null ? booking.getBookingCode() : "—";
            String receiptEmail = resolveReceiptEmail(payment, guest);
            String roomLabel = booking != null && booking.getRoomLabel() != null ? booking.getRoomLabel() : "—";
            String stayDates = booking != null
                    ? booking.getCheckIn() + " → " + booking.getCheckOut()
                    : "—";

            notify(
                    guest,
                    "Payment confirmed — booking secured",
                    "You paid RWF "
                            + amountPaid
                            + " for "
                            + roomLabel
                            + " ("
                            + stayDates
                            + "). Receipt "
                            + payment.getPaymentCode()
                            + (receiptEmail != null
                                    ? " — confirmation emailed to " + receiptEmail
                                    : "")
                            + ". Print or download your receipt from Reservations or Payments.",
                    NotificationCategory.BOOKING);
            notify(
                    guest,
                    "Payment receipt · " + payment.getPaymentCode(),
                    "RWF "
                            + amountPaid
                            + " via Paypack MoMo · "
                            + roomLabel
                            + " · "
                            + stayDates,
                    NotificationCategory.PAYMENT);

            personalizationService.refreshForGuest(guest);

            if (booking != null && receiptEmail != null) {
                String branchName =
                        booking.getBranch() != null ? booking.getBranch().getName() : null;
                int nights = (int) java.time.temporal.ChronoUnit.DAYS.between(
                        booking.getCheckIn(), booking.getCheckOut());
                String roomType =
                        booking.getRoomType() != null ? capitalizeRoomType(booking.getRoomType().name()) : null;
                emailService.sendPaymentReceiptEmail(
                        receiptEmail,
                        new EmailService.PaymentReceiptDetails(
                                guest.getName(),
                                payment.getPaymentCode(),
                                amountPaid,
                                payment.getIremboReference(),
                                PAID_AT_FMT.format(payment.getCreatedAt()),
                                booking.getBookingCode(),
                                roomLabel,
                                roomType,
                                booking.getCheckIn().toString(),
                                booking.getCheckOut().toString(),
                                nights,
                                booking.getGuestCount(),
                                booking.getAmountRwf(),
                                branchName));
            }
        }

        log.info(
                "Paypack payment completed ref={} amount={} merchant={}",
                paypackRef,
                amountPaid,
                paypackService.merchantPhonesDisplay());
        auditService.log(
                guest != null ? guest.getEmail() : "system",
                "Paypack payment completed: " + payment.getPaymentCode() + " — RWF " + amountPaid);
    }

    @Transactional
    public void simulateCompleteIfNeeded(Payment payment) {
        if (payment.getStatus() != PaymentStatus.PENDING) {
            return;
        }
        String ref = payment.getIremboReference();
        if (ref == null || !ref.startsWith("PAYPACK-")) {
            return;
        }
        String paypackRef = ref.substring("PAYPACK-".length());
        completePaypackPayment(paypackRef, payment.getAmountRwf(), "successful");
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

    private static String capitalizeRoomType(String name) {
        if (name == null || name.isBlank()) {
            return name;
        }
        return name.substring(0, 1).toUpperCase() + name.substring(1).toLowerCase();
    }

    /**
     * Email typed at payment time first; guest login email only if that field was not saved (legacy rows).
     */
    private String resolveReceiptEmail(Payment payment, UserAccount guest) {
        if (payment.getConfirmationEmail() != null && !payment.getConfirmationEmail().isBlank()) {
            return payment.getConfirmationEmail().trim().toLowerCase();
        }
        if (guest != null && guest.getEmail() != null && !guest.getEmail().isBlank()) {
            log.warn(
                    "Payment {} has no confirmation_email — using guest login email {} for receipt",
                    payment.getPaymentCode(),
                    guest.getEmail());
            return guest.getEmail().trim().toLowerCase();
        }
        log.error("Payment {} completed — no email address available for receipt", payment.getPaymentCode());
        return null;
    }
}
