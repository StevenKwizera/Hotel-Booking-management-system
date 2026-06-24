package com.orkestra.service;

import com.orkestra.domain.entity.Payment;
import com.orkestra.domain.enums.PaymentStatus;
import com.orkestra.repository.PaymentRepository;
import java.util.List;
import java.util.UUID;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

/**
 * Keeps Orkestra in sync with Paypack when MoMo is approved on the guest's phone.
 * Webhooks cannot reach localhost, so we poll Paypack find + events APIs.
 */
@Service
public class PaypackPaymentSyncService {

    private static final Logger log = LoggerFactory.getLogger(PaypackPaymentSyncService.class);

    private final PaymentRepository paymentRepository;
    private final PaypackService paypackService;
    private final BookingPaymentService bookingPaymentService;

    public PaypackPaymentSyncService(
            PaymentRepository paymentRepository,
            PaypackService paypackService,
            BookingPaymentService bookingPaymentService) {
        this.paymentRepository = paymentRepository;
        this.paypackService = paypackService;
        this.bookingPaymentService = bookingPaymentService;
    }

    /** Poll Paypack every 15s for any pending MoMo payments still waiting on the phone. */
    @Scheduled(fixedDelayString = "${paypack.sync-interval-ms:15000}")
    public void scheduledSyncAllPending() {
        syncAllPendingInternal();
    }

    @Transactional
    public void syncPendingForUser(UUID userId) {
        paymentRepository.findByGuestUserIdOrderByCreatedAtDesc(userId).stream()
                .filter(this::isPendingPaypack)
                .forEach(this::syncOne);
    }

    @Transactional
    public boolean syncPaymentByCode(String paymentCode) {
        return paymentRepository.findAll().stream()
                .filter(p -> paymentCode.equals(p.getPaymentCode()))
                .findFirst()
                .map(p -> {
                    syncOne(p);
                    return p.getStatus() == PaymentStatus.COMPLETED;
                })
                .orElse(false);
    }

    private void syncAllPendingInternal() {
        List<Payment> pending = paymentRepository.findByStatus(PaymentStatus.PENDING);
        long paypackPending = pending.stream().filter(this::isPendingPaypack).count();
        if (paypackPending == 0) {
            return;
        }
        log.debug("Syncing {} pending Paypack payment(s) with Paypack API", paypackPending);
        pending.stream().filter(this::isPendingPaypack).forEach(this::syncOne);
    }

    private void syncOne(Payment payment) {
        String paypackRef = extractPaypackRef(payment);
        if (paypackRef == null) {
            return;
        }
        String status = paypackService.resolveTransactionStatus(paypackRef);
        log.info(
                "Paypack sync payment={} ref={} remoteStatus={}",
                payment.getPaymentCode(),
                paypackRef,
                status);
        if (paypackService.isSuccessfulStatus(status)) {
            bookingPaymentService.completePaypackPayment(paypackRef, payment.getAmountRwf(), status);
        }
    }

    private boolean isPendingPaypack(Payment payment) {
        return payment.getStatus() == PaymentStatus.PENDING
                && payment.getIremboReference() != null
                && payment.getIremboReference().startsWith("PAYPACK-");
    }

    private String extractPaypackRef(Payment payment) {
        if (!StringUtils.hasText(payment.getIremboReference())) {
            return null;
        }
        String stored = payment.getIremboReference();
        if (!stored.startsWith("PAYPACK-")) {
            return null;
        }
        return stored.substring("PAYPACK-".length());
    }
}
