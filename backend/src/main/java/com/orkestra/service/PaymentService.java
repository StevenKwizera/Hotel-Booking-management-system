package com.orkestra.service;

import com.orkestra.domain.entity.*;
import com.orkestra.domain.enums.NotificationCategory;
import com.orkestra.domain.enums.PaymentMethod;
import com.orkestra.domain.enums.PaymentStatus;
import com.orkestra.domain.enums.UserRole;
import com.orkestra.dto.ApiDtos;
import com.orkestra.repository.GuestProfileRepository;
import com.orkestra.repository.NotificationRepository;
import com.orkestra.repository.PaymentRepository;
import com.orkestra.repository.UserAccountRepository;
import java.util.List;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

@Service
public class PaymentService {

    private final PaymentRepository paymentRepository;
    private final GuestProfileRepository guestProfileRepository;
    private final UserAccountRepository userAccountRepository;
    private final NotificationRepository notificationRepository;
    private final CurrentUserService currentUser;
    private final AuditService auditService;
    private final PaypackService paypackService;
    private final BookingPaymentService bookingPaymentService;
    private final PaypackPaymentSyncService paypackPaymentSyncService;

    public PaymentService(
            PaymentRepository paymentRepository,
            GuestProfileRepository guestProfileRepository,
            UserAccountRepository userAccountRepository,
            NotificationRepository notificationRepository,
            CurrentUserService currentUser,
            AuditService auditService,
            PaypackService paypackService,
            BookingPaymentService bookingPaymentService,
            PaypackPaymentSyncService paypackPaymentSyncService) {
        this.paymentRepository = paymentRepository;
        this.guestProfileRepository = guestProfileRepository;
        this.userAccountRepository = userAccountRepository;
        this.notificationRepository = notificationRepository;
        this.currentUser = currentUser;
        this.auditService = auditService;
        this.paypackService = paypackService;
        this.bookingPaymentService = bookingPaymentService;
        this.paypackPaymentSyncService = paypackPaymentSyncService;
    }

    public List<ApiDtos.PaymentDto> list() {
        UserAccount user = currentUser.requireUser();
        if (user.getRole() == UserRole.GUEST) {
            paypackPaymentSyncService.syncPendingForUser(user.getId());
        }
        List<Payment> payments = user.getRole() == UserRole.GUEST
                ? paymentRepository.findByGuestUserIdOrderByCreatedAtDesc(user.getId())
                : paymentRepository.findAllByOrderByCreatedAtDesc();
        return payments.stream().map(DtoMapper::toPayment).toList();
    }

    public ApiDtos.BalanceDto balance() {
        UserAccount user = currentUser.requireUser();
        GuestProfile profile = guestProfileRepository.findByUserId(user.getId())
                .orElseThrow(() -> new IllegalArgumentException("Guest profile not found"));
        return new ApiDtos.BalanceDto(profile.getBalanceRwf());
    }

    @Transactional
    public ApiDtos.PaypackPaymentInitDto payWithPaypack(ApiDtos.CreatePaymentRequest req) {
        UserAccount user = currentUser.requireUser();
        GuestProfile profile = guestProfileRepository.findByUserId(user.getId())
                .orElseThrow(() -> new IllegalArgumentException("Guest profile not found"));

        if (!StringUtils.hasText(req.phoneNumber())) {
            throw new IllegalArgumentException("Mobile money phone number is required");
        }

        long amount = req.amount() > 0 ? req.amount() : profile.getBalanceRwf();
        if (amount <= 0) {
            throw new IllegalArgumentException("No balance to pay");
        }

        long chargeAmount = paypackService.resolveChargeAmount(amount);
        PaypackService.CashinResult cashin = paypackService.cashin(chargeAmount, req.phoneNumber());

        Payment payment = new Payment();
        payment.setPaymentCode("PAY-" + System.currentTimeMillis() % 100000);
        payment.setGuestUser(user);
        payment.setGuestName(user.getName());
        payment.setAmountRwf(chargeAmount);
        payment.setMethod(PaymentMethod.PAYPACK);
        payment.setStatus(PaymentStatus.PENDING);
        payment.setIremboReference(paypackService.paypackReference(cashin.ref()));
        payment = paymentRepository.save(payment);

        if (cashin.simulated()) {
            bookingPaymentService.completePaypackPayment(cashin.ref(), chargeAmount, "successful");
        }

        String message = cashin.simulated()
                ? "Test Paypack payment simulated — balance updated."
                : "Approve the MoMo prompt on your phone. RWF " + chargeAmount + " via Paypack.";

        auditService.log(user.getEmail(),
                "Paypack balance payment initiated: " + payment.getPaymentCode() + " — RWF " + chargeAmount);

        return new ApiDtos.PaypackPaymentInitDto(
                payment.getPaymentCode(),
                cashin.ref(),
                chargeAmount,
                amount,
                cashin.status(),
                message,
                chargeAmount != amount);
    }

    @Transactional
    public ApiDtos.PaymentDto recordStaffPayment(ApiDtos.StaffPaymentRequest req) {
        UserAccount actor = currentUser.requireUser();
        if (actor.getRole() == UserRole.GUEST) {
            throw new IllegalArgumentException("Guests cannot record staff payments");
        }
        if (req.guestEmail() == null || req.guestEmail().isBlank()) {
            throw new IllegalArgumentException("Guest email is required");
        }
        if (req.amount() <= 0) {
            throw new IllegalArgumentException("Amount must be positive");
        }

        UserAccount guestUser = userAccountRepository.findByEmailIgnoreCase(req.guestEmail().trim().toLowerCase())
                .orElseThrow(() -> new IllegalArgumentException("Guest not found: " + req.guestEmail()));
        GuestProfile profile = guestProfileRepository.findByUserId(guestUser.getId())
                .orElseThrow(() -> new IllegalArgumentException("Guest profile not found"));

        Payment payment = new Payment();
        payment.setPaymentCode("PAY-" + System.currentTimeMillis() % 100000);
        payment.setGuestUser(guestUser);
        payment.setGuestName(guestUser.getName());
        payment.setAmountRwf(req.amount());
        payment.setMethod(PaymentMethod.PAYPACK);
        payment.setStatus(PaymentStatus.COMPLETED);
        payment.setIremboReference(
                req.reference() != null && !req.reference().isBlank()
                        ? req.reference()
                        : paypackService.paypackReference("STAFF-" + payment.getPaymentCode()));
        payment = paymentRepository.save(payment);

        profile.setBalanceRwf(Math.max(0, profile.getBalanceRwf() - req.amount()));
        guestProfileRepository.save(profile);

        Notification n = new Notification();
        n.setUser(guestUser);
        n.setTitle("Payment receipt");
        n.setBody("RWF " + req.amount() + " received via Paypack MoMo");
        n.setCategory(NotificationCategory.PAYMENT);
        n.setRead(false);
        notificationRepository.save(n);

        auditService.log(actor.getEmail(),
                "Staff recorded Paypack payment " + payment.getPaymentCode() + " for " + guestUser.getEmail()
                        + " — RWF " + req.amount());

        return DtoMapper.toPayment(payment);
    }

    @Transactional
    public ApiDtos.PaymentDto processPending(String paymentCode) {
        UserAccount actor = requireFinance();
        Payment payment = findPayment(paymentCode);
        if (payment.getStatus() == PaymentStatus.FLAGGED) {
            throw new IllegalArgumentException("Resolve flagged payment before approving");
        }
        if (payment.getStatus() != PaymentStatus.PENDING) {
            throw new IllegalArgumentException("Only pending payments can be approved");
        }
        payment.setStatus(PaymentStatus.COMPLETED);
        payment.setFinanceVerified(true);
        payment = paymentRepository.save(payment);
        auditService.log(actor.getEmail(), "Approved payment: " + paymentCode + " — RWF " + payment.getAmountRwf());
        return DtoMapper.toPayment(payment);
    }

    @Transactional
    public ApiDtos.PaymentDto verifyPayment(String paymentCode) {
        UserAccount actor = requireFinance();
        Payment payment = findPayment(paymentCode);
        if (payment.getStatus() == PaymentStatus.REFUNDED) {
            throw new IllegalArgumentException("Cannot verify a refunded payment");
        }
        payment.setFinanceVerified(true);
        payment = paymentRepository.save(payment);
        auditService.log(actor.getEmail(), "Verified payment: " + paymentCode + " — RWF " + payment.getAmountRwf());
        return DtoMapper.toPayment(payment);
    }

    @Transactional
    public ApiDtos.PaymentDto flagPayment(String paymentCode) {
        UserAccount actor = requireFinance();
        Payment payment = findPayment(paymentCode);
        if (payment.getStatus() == PaymentStatus.REFUNDED) {
            throw new IllegalArgumentException("Cannot flag a refunded payment");
        }
        payment.setStatus(PaymentStatus.FLAGGED);
        payment.setFinanceVerified(false);
        payment = paymentRepository.save(payment);
        auditService.log(actor.getEmail(), "Flagged payment for review: " + paymentCode);
        return DtoMapper.toPayment(payment);
    }

    private Payment findPayment(String paymentCode) {
        return paymentRepository.findAll().stream()
                .filter(p -> p.getPaymentCode().equals(paymentCode))
                .findFirst()
                .orElseThrow(() -> new IllegalArgumentException("Payment not found"));
    }

    private UserAccount requireFinance() {
        UserAccount user = currentUser.requireUser();
        if (user.getRole() != UserRole.FINANCE && user.getRole() != UserRole.ADMIN) {
            throw new IllegalArgumentException("Finance officer access required");
        }
        return user;
    }

    @Transactional
    public ApiDtos.PaymentDto refund(String paymentCode) {
        UserAccount actor = currentUser.requireUser();
        if (actor.getRole() != UserRole.FINANCE && actor.getRole() != UserRole.ADMIN) {
            throw new IllegalArgumentException("Only finance or admin can process refunds");
        }
        Payment payment = paymentRepository.findAll().stream()
                .filter(p -> p.getPaymentCode().equals(paymentCode))
                .findFirst()
                .orElseThrow(() -> new IllegalArgumentException("Payment not found"));
        if (payment.getStatus() == PaymentStatus.REFUNDED) {
            throw new IllegalArgumentException("Already refunded");
        }
        payment.setStatus(PaymentStatus.REFUNDED);
        Payment saved = paymentRepository.save(payment);
        long refundAmount = saved.getAmountRwf();

        if (saved.getGuestUser() != null) {
            guestProfileRepository.findByUserId(saved.getGuestUser().getId()).ifPresent(profile -> {
                profile.setBalanceRwf(profile.getBalanceRwf() + refundAmount);
                guestProfileRepository.save(profile);
            });
            Notification n = new Notification();
            n.setUser(saved.getGuestUser());
            n.setTitle("Refund processed");
            n.setBody("RWF " + refundAmount + " refunded for " + saved.getPaymentCode());
            n.setCategory(NotificationCategory.PAYMENT);
            n.setRead(false);
            notificationRepository.save(n);
        }

        auditService.log(actor.getEmail(), "Refund: " + paymentCode + " — RWF " + refundAmount);
        return DtoMapper.toPayment(saved);
    }
}
