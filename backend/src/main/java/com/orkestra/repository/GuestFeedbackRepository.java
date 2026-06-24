package com.orkestra.repository;

import com.orkestra.domain.entity.GuestFeedback;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface GuestFeedbackRepository extends JpaRepository<GuestFeedback, UUID> {

    List<GuestFeedback> findByGuestUserIdOrderByCreatedAtDesc(UUID guestUserId);

    List<GuestFeedback> findAllByOrderByCreatedAtDesc();

    Optional<GuestFeedback> findByFeedbackCode(String feedbackCode);
}
