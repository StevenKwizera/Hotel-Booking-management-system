package com.orkestra.repository;

import com.orkestra.domain.entity.Recommendation;
import java.util.List;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface RecommendationRepository extends JpaRepository<Recommendation, UUID> {
    List<Recommendation> findByGuestUserId(UUID guestUserId);

    List<Recommendation> findByGuestUserIdAndAppliedFalseOrderByConfidenceDesc(UUID guestUserId);

    List<Recommendation> findAllByOrderByConfidenceDesc();

    void deleteByGuestUserId(UUID guestUserId);
}
