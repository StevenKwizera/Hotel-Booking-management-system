package com.orkestra.repository;

import com.orkestra.domain.entity.BackupRecord;
import java.util.List;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface BackupRecordRepository extends JpaRepository<BackupRecord, UUID> {
    List<BackupRecord> findTop10ByOrderByCreatedAtDesc();
}
