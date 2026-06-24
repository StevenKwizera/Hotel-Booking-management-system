package com.orkestra.service;

import com.orkestra.domain.entity.Payment;
import com.orkestra.domain.entity.ServiceRequest;
import com.orkestra.domain.enums.BookingStatus;
import com.orkestra.domain.enums.ServiceStatus;
import com.orkestra.domain.enums.PaymentStatus;
import com.orkestra.dto.ApiDtos;
import com.orkestra.repository.AuditLogRepository;
import com.orkestra.repository.BookingRepository;
import com.orkestra.repository.BranchRepository;
import com.orkestra.repository.PaymentRepository;
import com.orkestra.repository.RoomRepository;
import com.orkestra.repository.ServiceRequestRepository;
import java.time.LocalDate;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.time.format.TextStyle;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import org.springframework.stereotype.Service;

@Service
public class AnalyticsService {

    private final BookingRepository bookingRepository;
    private final PaymentRepository paymentRepository;
    private final BranchRepository branchRepository;
    private final RoomRepository roomRepository;
    private final AuditLogRepository auditLogRepository;
    private final ServiceRequestRepository serviceRequestRepository;

    public AnalyticsService(
            BookingRepository bookingRepository,
            PaymentRepository paymentRepository,
            BranchRepository branchRepository,
            RoomRepository roomRepository,
            AuditLogRepository auditLogRepository,
            ServiceRequestRepository serviceRequestRepository) {
        this.bookingRepository = bookingRepository;
        this.paymentRepository = paymentRepository;
        this.branchRepository = branchRepository;
        this.roomRepository = roomRepository;
        this.auditLogRepository = auditLogRepository;
        this.serviceRequestRepository = serviceRequestRepository;
    }

    public ApiDtos.DashboardDto dashboard() {
        var branch = branchRepository.findByCode("KIGALI").orElse(null);
        long available = branch != null ? roomRepository.countByBranchIdAndAvailableTrue(branch.getId()) : 0;
        int total = branch != null ? branch.getTotalRooms() : 48;
        double occupancy = total > 0 ? ((total - available) * 100.0 / total) : 0;

        long pendingBookings = bookingRepository.countByStatus(BookingStatus.PENDING);
        long todayRevenue = paymentRepository.findAll().stream()
                .filter(p -> p.getStatus() == PaymentStatus.COMPLETED)
                .filter(p -> p.getCreatedAt()
                        .atZone(ZoneId.of("Africa/Kigali"))
                        .toLocalDate()
                        .equals(LocalDate.now()))
                .mapToLong(p -> p.getAmountRwf())
                .sum();

        List<ApiDtos.KpiDto> kpis = List.of(
                new ApiDtos.KpiDto("occupancy", "Occupancy Rate", String.format("%.0f%%", occupancy), 4.2, "up", "Bed"),
                new ApiDtos.KpiDto("revenue", "Revenue (Today)", "RWF " + formatM(todayRevenue), 12.5, "up", "TrendingUp"),
                new ApiDtos.KpiDto("bookings", "Active Bookings", String.valueOf(bookingRepository.count()), -2.0, "down", "CalendarCheck"),
                new ApiDtos.KpiDto("pending", "Pending Bookings", String.valueOf(pendingBookings), null, "neutral", "Clock"));

        return new ApiDtos.DashboardDto(kpis, Map.of("availableRooms", available));
    }

    public List<ApiDtos.OccupancyPoint> occupancyWeek() {
        var branch = branchRepository.findByCode("KIGALI").orElse(null);
        int totalRooms = branch != null ? branch.getTotalRooms() : 48;
        LocalDate today = LocalDate.now();
        List<ApiDtos.OccupancyPoint> points = new ArrayList<>();

        for (int i = 6; i >= 0; i--) {
            LocalDate day = today.minusDays(i);
            long occupied = bookingRepository.countOccupiedOnDate(day);
            int occupancyPct = totalRooms > 0 ? (int) Math.round(occupied * 100.0 / totalRooms) : 0;
            long revenueRwf = bookingRepository.sumRevenueForOccupiedOnDate(day);
            double revenueM = revenueRwf / 1_000_000.0;
            String label = day.getDayOfWeek().getDisplayName(TextStyle.SHORT, Locale.ENGLISH);
            points.add(new ApiDtos.OccupancyPoint(label, occupancyPct, Math.round(revenueM * 10) / 10.0));
        }
        return points;
    }

    public List<ApiDtos.BranchDto> branches() {
        return branchRepository.findAll().stream().map(DtoMapper::toBranch).toList();
    }

    public List<ApiDtos.AuditLogDto> auditLogs() {
        DateTimeFormatter fmt = DateTimeFormatter.ofPattern("HH:mm")
                .withZone(ZoneId.of("Africa/Kigali"));
        return auditLogRepository.findTop50ByOrderByCreatedAtDesc().stream()
                .map(l -> new ApiDtos.AuditLogDto(
                        l.getActorEmail(),
                        l.getAction(),
                        fmt.format(l.getCreatedAt())))
                .toList();
    }

    public List<ApiDtos.StaffPerformanceDto> staffPerformance() {
        Map<String, int[]> counts = new java.util.LinkedHashMap<>();
        for (ServiceRequest sr : serviceRequestRepository.findAllByOrderByCreatedAtDesc()) {
            String name = sr.getAssignedStaffName();
            if (name == null || name.isBlank()) {
                name = "Unassigned";
            }
            int[] c = counts.computeIfAbsent(name, k -> new int[4]);
            c[0]++;
            if (sr.getStatus() == ServiceStatus.COMPLETED) {
                c[1]++;
            } else if (sr.getStatus() == ServiceStatus.IN_PROGRESS) {
                c[2]++;
            } else {
                c[3]++;
            }
        }
        List<ApiDtos.StaffPerformanceDto> result = new ArrayList<>();
        for (var entry : counts.entrySet()) {
            int[] c = entry.getValue();
            int rate = c[0] > 0 ? (int) Math.round(c[1] * 100.0 / c[0]) : 0;
            result.add(new ApiDtos.StaffPerformanceDto(
                    entry.getKey(), c[0], c[1], c[2], c[3], rate));
        }
        result.sort((a, b) -> Integer.compare(b.assigned(), a.assigned()));
        return result;
    }

    public ApiDtos.FinanceRevenueDto financeRevenue() {
        ZoneId zone = ZoneId.of("Africa/Kigali");
        LocalDate today = LocalDate.now(zone);
        LocalDate weekStart = today.minusDays(6);
        LocalDate monthStart = today.withDayOfMonth(1);

        long todayRev = 0;
        long weekRev = 0;
        long monthRev = 0;
        int pending = 0;
        int flagged = 0;
        int verified = 0;
        Map<String, long[]> byMethod = new java.util.LinkedHashMap<>();

        for (Payment p : paymentRepository.findAll()) {
            if (p.isFinanceVerified()) verified++;
            if (p.getStatus() == PaymentStatus.PENDING) pending++;
            if (p.getStatus() == PaymentStatus.FLAGGED) flagged++;

            if (p.getStatus() != PaymentStatus.COMPLETED) continue;

            LocalDate d = p.getCreatedAt().atZone(zone).toLocalDate();
            long amt = p.getAmountRwf();
            if (d.equals(today)) todayRev += amt;
            if (!d.isBefore(weekStart)) weekRev += amt;
            if (!d.isBefore(monthStart)) monthRev += amt;

            String method = DtoMapper.toPayment(p).method();
            long[] mc = byMethod.computeIfAbsent(method, k -> new long[2]);
            mc[0] += amt;
            mc[1]++;
        }

        List<ApiDtos.RevenueByMethodDto> methods = new ArrayList<>();
        for (var e : byMethod.entrySet()) {
            methods.add(new ApiDtos.RevenueByMethodDto(e.getKey(), e.getValue()[0], (int) e.getValue()[1]));
        }
        methods.sort((a, b) -> Long.compare(b.amountRwf(), a.amountRwf()));

        return new ApiDtos.FinanceRevenueDto(
                todayRev, weekRev, monthRev, pending, flagged, verified, methods);
    }

    public List<ApiDtos.AuditLogDto> serviceLogs() {
        DateTimeFormatter fmt = DateTimeFormatter.ofPattern("dd MMM yyyy, HH:mm")
                .withZone(ZoneId.of("Africa/Kigali"));
        return auditLogRepository.findTop50ByOrderByCreatedAtDesc().stream()
                .filter(log -> isServiceRecord(log.getAction()))
                .map(log -> new ApiDtos.AuditLogDto(
                        log.getActorEmail(),
                        log.getAction(),
                        fmt.format(log.getCreatedAt())))
                .toList();
    }

    public List<ApiDtos.AuditLogDto> receptionLogs() {
        DateTimeFormatter fmt = DateTimeFormatter.ofPattern("dd MMM yyyy, HH:mm")
                .withZone(ZoneId.of("Africa/Kigali"));
        return auditLogRepository.findTop50ByOrderByCreatedAtDesc().stream()
                .filter(log -> isReceptionRecord(log.getAction()))
                .map(log -> new ApiDtos.AuditLogDto(
                        log.getActorEmail(),
                        log.getAction(),
                        fmt.format(log.getCreatedAt())))
                .toList();
    }

    private static boolean isReceptionRecord(String action) {
        if (action == null) return false;
        String lower = action.toLowerCase();
        return lower.contains("check-in")
                || lower.contains("check-out")
                || lower.contains("checkout")
                || lower.contains("reservation verified")
                || lower.contains("checked in")
                || lower.contains("room released")
                || lower.contains("booking flow")
                || lower.contains("checkout charges verified")
                || lower.contains("invoice generated")
                || lower.contains("guest history saved")
                || lower.contains("bill calculated")
                || lower.contains("guest arrived")
                || lower.contains("walk-in");
    }

    private static boolean isServiceRecord(String action) {
        if (action == null) return false;
        String lower = action.toLowerCase();
        return lower.contains("service")
                || lower.startsWith("sr-")
                || lower.contains("housekeeping")
                || lower.contains("maintenance")
                || lower.contains("room service");
    }

    private String formatM(long rwf) {
        if (rwf >= 1_000_000) return String.format("%.1fM", rwf / 1_000_000.0);
        if (rwf >= 1_000) return String.format("%.0fK", rwf / 1_000.0);
        return String.valueOf(rwf);
    }
}
