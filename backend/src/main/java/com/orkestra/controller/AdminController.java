package com.orkestra.controller;

import com.orkestra.dto.ApiDtos;
import com.orkestra.service.AdminService;
import java.util.List;
import java.util.UUID;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/admin")
public class AdminController {

    private final AdminService adminService;

    public AdminController(AdminService adminService) {
        this.adminService = adminService;
    }

    @GetMapping("/settings")
    public ApiDtos.SystemSettingsDto settings() {
        return adminService.getSettings();
    }

    @PutMapping("/settings")
    public ApiDtos.SystemSettingsDto updateSettings(@RequestBody ApiDtos.UpdateSystemSettingsRequest req) {
        return adminService.updateSettings(req);
    }

    @GetMapping("/security-logs")
    public List<ApiDtos.AuditLogDto> securityLogs() {
        return adminService.securityLogs();
    }

    @GetMapping("/backups")
    public List<ApiDtos.BackupRecordDto> backups() {
        return adminService.backupHistory();
    }

    @PostMapping("/backup")
    public ApiDtos.BackupResultDto backup() {
        return adminService.runBackup();
    }

    @PatchMapping("/branches/{id}")
    public ApiDtos.BranchDto updateBranch(
            @PathVariable UUID id,
            @RequestBody ApiDtos.UpdateBranchRequest req) {
        return adminService.updateBranch(id, req);
    }
}
