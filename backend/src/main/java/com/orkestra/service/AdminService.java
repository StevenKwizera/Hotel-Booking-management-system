package com.orkestra.service;

import com.orkestra.domain.entity.BackupRecord;
import com.orkestra.domain.entity.Branch;
import com.orkestra.domain.entity.SystemConfig;
import com.orkestra.domain.entity.UserAccount;
import com.orkestra.domain.enums.UserRole;
import com.orkestra.dto.ApiDtos;
import com.orkestra.repository.AuditLogRepository;
import com.orkestra.repository.BackupRecordRepository;
import com.orkestra.repository.BookingRepository;
import com.orkestra.repository.BranchRepository;
import com.orkestra.repository.PaymentRepository;
import com.orkestra.repository.SystemConfigRepository;
import com.orkestra.repository.UserAccountRepository;
import java.time.Instant;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class AdminService {

    private static final DateTimeFormatter FMT =
            DateTimeFormatter.ofPattern("dd MMM yyyy, HH:mm").withZone(ZoneId.of("Africa/Kigali"));

    private final SystemConfigRepository systemConfigRepository;
    private final BackupRecordRepository backupRecordRepository;
    private final BranchRepository branchRepository;
    private final UserAccountRepository userRepository;
    private final BookingRepository bookingRepository;
    private final PaymentRepository paymentRepository;
    private final AuditLogRepository auditLogRepository;
    private final AuditService auditService;
    private final CurrentUserService currentUser;

    public AdminService(
            SystemConfigRepository systemConfigRepository,
            BackupRecordRepository backupRecordRepository,
            BranchRepository branchRepository,
            UserAccountRepository userRepository,
            BookingRepository bookingRepository,
            PaymentRepository paymentRepository,
            AuditLogRepository auditLogRepository,
            AuditService auditService,
            CurrentUserService currentUser) {
        this.systemConfigRepository = systemConfigRepository;
        this.backupRecordRepository = backupRecordRepository;
        this.branchRepository = branchRepository;
        this.userRepository = userRepository;
        this.bookingRepository = bookingRepository;
        this.paymentRepository = paymentRepository;
        this.auditLogRepository = auditLogRepository;
        this.auditService = auditService;
        this.currentUser = currentUser;
    }

    public SystemConfig getOrCreateConfig() {
        return systemConfigRepository.findById(1L).orElseGet(() -> {
            SystemConfig cfg = new SystemConfig();
            cfg.setId(1L);
            return systemConfigRepository.save(cfg);
        });
    }

    public ApiDtos.SystemSettingsDto getSettings() {
        requireAdmin();
        SystemConfig cfg = getOrCreateConfig();
        return toSettingsDto(cfg);
    }

    @Transactional
    public ApiDtos.SystemSettingsDto updateSettings(ApiDtos.UpdateSystemSettingsRequest req) {
        UserAccount actor = requireAdmin();
        SystemConfig cfg = getOrCreateConfig();
        if (req.hotelName() != null && !req.hotelName().isBlank()) {
            cfg.setHotelName(req.hotelName().trim());
        }
        if (req.branchDisplayName() != null && !req.branchDisplayName().isBlank()) {
            cfg.setBranchDisplayName(req.branchDisplayName().trim());
        }
        if (req.otpAdmin() != null) cfg.setOtpAdmin(req.otpAdmin());
        if (req.otpManagement() != null) cfg.setOtpManagement(req.otpManagement());
        if (req.otpFinance() != null) cfg.setOtpFinance(req.otpFinance());
        if (req.sessionTimeoutMinutes() != null && req.sessionTimeoutMinutes() >= 5) {
            cfg.setSessionTimeoutMinutes(req.sessionTimeoutMinutes());
        }
        if (req.auditLoggingEnabled() != null) cfg.setAuditLoggingEnabled(req.auditLoggingEnabled());
        cfg = systemConfigRepository.save(cfg);
        auditService.log(actor.getEmail(), "System settings updated");
        return toSettingsDto(cfg);
    }

    public List<ApiDtos.AuditLogDto> securityLogs() {
        requireAdmin();
        return auditLogRepository.findAll().stream()
                .sorted((a, b) -> b.getCreatedAt().compareTo(a.getCreatedAt()))
                .filter(log -> isSecurityEvent(log.getAction()))
                .limit(100)
                .map(log -> new ApiDtos.AuditLogDto(
                        log.getActorEmail(),
                        log.getAction(),
                        FMT.format(log.getCreatedAt())))
                .toList();
    }

    public List<ApiDtos.BackupRecordDto> backupHistory() {
        requireAdmin();
        return backupRecordRepository.findTop10ByOrderByCreatedAtDesc().stream()
                .map(this::toBackupDto)
                .toList();
    }

    @Transactional
    public ApiDtos.BackupResultDto runBackup() {
        UserAccount actor = requireAdmin();
        int users = (int) userRepository.count();
        int bookings = (int) bookingRepository.count();
        int payments = (int) paymentRepository.count();
        int audits = (int) auditLogRepository.count();

        Map<String, Object> payload = new LinkedHashMap<>();
        payload.put("system", "Orkestra Hospitality Management System");
        payload.put("hotel", getOrCreateConfig().getHotelName());
        payload.put("exportedAt", Instant.now().toString());
        payload.put("counts", Map.of(
                "users", users,
                "bookings", bookings,
                "payments", payments,
                "auditLogs", audits,
                "branches", branchRepository.count()));
        payload.put("branches", branchRepository.findAll().stream()
                .map(DtoMapper::toBranch)
                .toList());
        payload.put("auditLogs", auditLogRepository.findAll().stream()
                .sorted((a, b) -> b.getCreatedAt().compareTo(a.getCreatedAt()))
                .limit(200)
                .map(log -> new ApiDtos.AuditLogDto(
                        log.getActorEmail(),
                        log.getAction(),
                        FMT.format(log.getCreatedAt())))
                .toList());

        String jsonEstimate = payload.toString();
        long sizeBytes = jsonEstimate.length() * 2L;

        BackupRecord record = new BackupRecord();
        record.setCreatedBy(actor.getEmail());
        record.setLabel("Full snapshot — " + FMT.format(Instant.now()));
        record.setSizeBytes(sizeBytes);
        record.setUserCount(users);
        record.setBookingCount(bookings);
        record.setPaymentCount(payments);
        record.setAuditCount(audits);
        record = backupRecordRepository.save(record);

        auditService.log(actor.getEmail(), "Database backup completed — " + record.getLabel());
        return new ApiDtos.BackupResultDto(toBackupDto(record), payload);
    }

    @Transactional
    public ApiDtos.BranchDto updateBranch(UUID branchId, ApiDtos.UpdateBranchRequest req) {
        UserAccount actor = requireAdmin();
        Branch branch = branchRepository.findById(branchId)
                .orElseThrow(() -> new IllegalArgumentException("Branch not found"));
        if (req.status() != null && !req.status().isBlank()) {
            String status = req.status().trim().toLowerCase();
            if (!List.of("active", "maintenance", "offline").contains(status)) {
                throw new IllegalArgumentException("Status must be active, maintenance, or offline");
            }
            branch.setStatus(status);
        }
        if (req.name() != null && !req.name().isBlank()) {
            branch.setName(req.name().trim());
        }
        branch = branchRepository.save(branch);
        auditService.log(actor.getEmail(), "Branch updated: " + branch.getName() + " → " + branch.getStatus());
        return DtoMapper.toBranch(branch);
    }

    private UserAccount requireAdmin() {
        UserAccount user = currentUser.requireUser();
        if (user.getRole() != UserRole.ADMIN) {
            throw new IllegalArgumentException("Administrator access required");
        }
        return user;
    }

    private static boolean isSecurityEvent(String action) {
        if (action == null) return false;
        String lower = action.toLowerCase();
        return lower.contains("login")
                || lower.contains("otp")
                || lower.contains("password")
                || lower.contains("failed")
                || lower.contains("security")
                || lower.contains("settings")
                || lower.contains("backup")
                || lower.contains("deleted user")
                || lower.contains("reset password");
    }

    private ApiDtos.SystemSettingsDto toSettingsDto(SystemConfig cfg) {
        return new ApiDtos.SystemSettingsDto(
                cfg.getHotelName(),
                cfg.getBranchDisplayName(),
                cfg.isOtpAdmin(),
                cfg.isOtpManagement(),
                cfg.isOtpFinance(),
                cfg.getSessionTimeoutMinutes(),
                cfg.isAuditLoggingEnabled());
    }

    private ApiDtos.BackupRecordDto toBackupDto(BackupRecord r) {
        return new ApiDtos.BackupRecordDto(
                r.getId().toString(),
                FMT.format(r.getCreatedAt()),
                r.getCreatedBy(),
                r.getLabel(),
                r.getSizeBytes(),
                r.getUserCount(),
                r.getBookingCount(),
                r.getPaymentCount(),
                r.getAuditCount());
    }
}
