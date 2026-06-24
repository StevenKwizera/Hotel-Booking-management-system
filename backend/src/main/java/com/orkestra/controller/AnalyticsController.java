package com.orkestra.controller;

import com.orkestra.dto.ApiDtos;
import com.orkestra.service.AnalyticsService;
import com.orkestra.service.RoleDashboardService;
import java.util.List;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/analytics")
public class AnalyticsController {

    private final AnalyticsService analyticsService;
    private final RoleDashboardService roleDashboardService;

    public AnalyticsController(AnalyticsService analyticsService, RoleDashboardService roleDashboardService) {
        this.analyticsService = analyticsService;
        this.roleDashboardService = roleDashboardService;
    }

    @GetMapping("/role-dashboard")
    public ApiDtos.RoleDashboardDto roleDashboard() {
        return roleDashboardService.forCurrentUser();
    }

    @GetMapping("/dashboard")
    public ApiDtos.DashboardDto dashboard() {
        return analyticsService.dashboard();
    }

    @GetMapping("/occupancy")
    public List<ApiDtos.OccupancyPoint> occupancy() {
        return analyticsService.occupancyWeek();
    }

    @GetMapping("/branches")
    public List<ApiDtos.BranchDto> branches() {
        return analyticsService.branches();
    }

    @GetMapping("/audit-logs")
    public List<ApiDtos.AuditLogDto> auditLogs() {
        return analyticsService.auditLogs();
    }

    @GetMapping("/staff-performance")
    public List<ApiDtos.StaffPerformanceDto> staffPerformance() {
        return analyticsService.staffPerformance();
    }

    @GetMapping("/finance/revenue")
    public ApiDtos.FinanceRevenueDto financeRevenue() {
        return analyticsService.financeRevenue();
    }

    @GetMapping("/service-logs")
    public List<ApiDtos.AuditLogDto> serviceLogs() {
        return analyticsService.serviceLogs();
    }

    @GetMapping("/reception-logs")
    public List<ApiDtos.AuditLogDto> receptionLogs() {
        return analyticsService.receptionLogs();
    }
}
