package com.orkestra.repository;

import com.orkestra.domain.entity.ServiceRequest;
import com.orkestra.domain.enums.ServiceStatus;
import java.util.List;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ServiceRequestRepository extends JpaRepository<ServiceRequest, UUID> {
    List<ServiceRequest> findByGuestUserIdOrderByCreatedAtDesc(UUID guestUserId);
    List<ServiceRequest> findAllByOrderByCreatedAtDesc();
    List<ServiceRequest> findByStatusNot(ServiceStatus status);
    long countByStatus(ServiceStatus status);
}
