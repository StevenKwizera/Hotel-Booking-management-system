package com.orkestra.repository;

import com.orkestra.domain.entity.GuestProfile;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface GuestProfileRepository extends JpaRepository<GuestProfile, UUID> {
    Optional<GuestProfile> findByUserId(UUID userId);
    List<GuestProfile> findAllByOrderByVisitCountDesc();
}
