package com.orkestra.repository;

import com.orkestra.domain.entity.Payment;
import com.orkestra.domain.enums.PaymentStatus;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
public interface PaymentRepository extends JpaRepository<Payment, UUID> {
    List<Payment> findByGuestUserIdOrderByCreatedAtDesc(UUID guestUserId);
    List<Payment> findAllByOrderByCreatedAtDesc();
    List<Payment> findByStatus(PaymentStatus status);
    java.util.Optional<Payment> findByIremboReference(String iremboReference);

    java.util.Optional<Payment> findByPaymentCode(String paymentCode);
}
