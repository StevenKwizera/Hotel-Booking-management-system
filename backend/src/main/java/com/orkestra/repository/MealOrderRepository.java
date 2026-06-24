package com.orkestra.repository;

import com.orkestra.domain.entity.MealOrder;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface MealOrderRepository extends JpaRepository<MealOrder, UUID> {

    Optional<MealOrder> findByOrderCode(String orderCode);

    List<MealOrder> findByGuestUserIdOrderByCreatedAtDesc(UUID guestUserId);

    List<MealOrder> findAllByOrderByCreatedAtDesc();
}
