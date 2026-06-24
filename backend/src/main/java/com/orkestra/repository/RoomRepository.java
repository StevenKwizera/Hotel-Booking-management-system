package com.orkestra.repository;

import com.orkestra.domain.entity.Room;
import com.orkestra.domain.enums.RoomType;
import java.util.List;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

public interface RoomRepository extends JpaRepository<Room, UUID> {
    List<Room> findByBranchIdAndAvailableTrue(UUID branchId);
    long countByBranchIdAndAvailableTrue(UUID branchId);
    List<Room> findByBranchId(UUID branchId);
}
