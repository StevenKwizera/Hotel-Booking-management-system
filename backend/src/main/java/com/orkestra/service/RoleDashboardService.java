package com.orkestra.service;

import com.orkestra.domain.entity.*;
import com.orkestra.domain.enums.*;
import com.orkestra.dto.ApiDtos;
import com.orkestra.repository.*;
import java.time.LocalDate;
import java.time.ZoneId;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import org.springframework.stereotype.Service;

@Service
public class RoleDashboardService {

    private final CurrentUserService currentUser;
    private final BookingRepository bookingRepository;
    private final ServiceRequestRepository serviceRepository;
    private final PaymentRepository paymentRepository;
    private final GuestProfileRepository guestProfileRepository;
    private final NotificationRepository notificationRepository;
    private final WorkflowService workflowService;
    private final AnalyticsService analyticsService;

    public RoleDashboardService(
            CurrentUserService currentUser,
            BookingRepository bookingRepository,
            ServiceRequestRepository serviceRepository,
            PaymentRepository paymentRepository,
            GuestProfileRepository guestProfileRepository,
            NotificationRepository notificationRepository,
            WorkflowService workflowService,
            AnalyticsService analyticsService) {
        this.currentUser = currentUser;
        this.bookingRepository = bookingRepository;
        this.serviceRepository = serviceRepository;
        this.paymentRepository = paymentRepository;
        this.guestProfileRepository = guestProfileRepository;
        this.notificationRepository = notificationRepository;
        this.workflowService = workflowService;
        this.analyticsService = analyticsService;
    }

    public ApiDtos.RoleDashboardDto forCurrentUser() {
        UserAccount user = currentUser.requireUser();
        return switch (user.getRole()) {
            case GUEST -> guestDashboard(user);
            case RECEPTIONIST -> receptionistDashboard();
            case STAFF -> staffDashboard(user);
            case FINANCE -> financeDashboard();
            case MANAGEMENT -> managementDashboard();
            case ADMIN -> adminDashboard();
        };
    }

    private ApiDtos.RoleDashboardDto guestDashboard(UserAccount user) {
        GuestProfile profile = guestProfileRepository.findByUserId(user.getId()).orElse(null);
        long balance = profile != null ? profile.getBalanceRwf() : 0;
        List<Booking> myBookings = bookingRepository.findByGuestUserIdOrderByCreatedAtDesc(user.getId());
        Booking active = myBookings.stream()
                .filter(b -> b.getStatus() == BookingStatus.CHECKED_IN)
                .findFirst()
                .orElse(myBookings.stream()
                        .filter(b -> b.getStatus() == BookingStatus.CONFIRMED
                                || b.getStatus() == BookingStatus.APPROVED
                                || b.getStatus() == BookingStatus.PENDING)
                        .findFirst()
                        .orElse(null));

        String room = active != null ? active.getRoomLabel() : "—";
        String checkIn = active != null ? active.getCheckIn().toString() : "—";
        String checkout = active != null ? active.getCheckOut().toString() : "—";
        String bookingRef = active != null ? active.getBookingCode() : "—";
        String stayStatus = active == null
                ? "No active stay"
                : switch (active.getStatus()) {
                    case CHECKED_IN -> "Checked in";
                    case CONFIRMED -> "Confirmed";
                    case APPROVED -> "Approved — pay now";
                    case PENDING -> "Pending approval";
                    default -> capitalize(active.getStatus().name().replace('_', ' '));
                };
        String tier = profile != null ? capitalize(profile.getTier().name()) : "Standard";
        long openServices = serviceRepository.findByGuestUserIdOrderByCreatedAtDesc(user.getId()).stream()
                .filter(s -> s.getStatus() != ServiceStatus.COMPLETED)
                .count();
        long unread = notificationRepository.countByUserIdAndReadFalse(user.getId());

        List<ApiDtos.KpiDto> kpis = List.of(
                new ApiDtos.KpiDto("stay", "Stay status", stayStatus, null, "neutral", "Hotel"),
                new ApiDtos.KpiDto("room", "Your room", room, null, "neutral", "Bed"),
                new ApiDtos.KpiDto("checkin", "Check-in", checkIn, null, "neutral", "LogIn"),
                new ApiDtos.KpiDto("checkout", "Check-out", checkout, null, "neutral", "Calendar"),
                new ApiDtos.KpiDto("booking", "Booking ref", bookingRef, null, "neutral", "Hash"),
                new ApiDtos.KpiDto("balance", "Balance due", formatRwf(balance), null, balance > 0 ? "down" : "up", "Wallet"),
                new ApiDtos.KpiDto("tier", "Loyalty tier", tier, null, "neutral", "Award"));

        List<ApiDtos.RoleTaskDto> tasks = new ArrayList<>();
        if (active == null) {
            tasks.add(task("guest-book", "Book a room online", "Search availability and reserve your stay",
                    "CalendarPlus", "Book now", "/reservations", "high"));
        } else {
            if (active.getStatus() == BookingStatus.APPROVED) {
                tasks.add(task("guest-paypack", "Continue with payment",
                        "Pay RWF " + active.getAmountRwf() + " via Paypack MoMo to confirm your stay",
                        "CreditCard", "Pay now", "/reservations#pay-booking", "high"));
            }
            if (active.getStatus() == BookingStatus.CONFIRMED || active.getStatus() == BookingStatus.PENDING) {
                tasks.add(task("guest-arrival", "Record your arrival", "Let reception know you have arrived at the hotel",
                        "MapPin", "I'm here", "/check-in-out#arrival", "high"));
            }
            if (active.getStatus() == BookingStatus.CHECKED_IN) {
                tasks.add(task("guest-checkout", "Request check-out", "Notify reception when you are ready to leave",
                        "LogOut", "Request checkout", "/check-in-out", "high"));
                if (openServices == 0) {
                    tasks.add(task("guest-svc-new", "Request hotel services", "Room service, housekeeping, maintenance, concierge",
                            "ConciergeBell", "New request", "/services", "normal"));
                }
            }
        }
        if (balance > 0) {
            tasks.add(task("guest-pay", "Pay outstanding balance", "RWF " + balance + " due — Paypack MoMo",
                    "CreditCard", "Pay now", "/payments", "high"));
        }
        if (openServices > 0) {
            tasks.add(task("guest-svc", "Track service requests", openServices + " open request(s)",
                    "ConciergeBell", "View services", "/services", "normal"));
        }
        tasks.add(task("guest-ai", "Personalized recommendations", "Room, dining & spa offers for you",
                "Sparkles", "View offers", "/ai-personalization", "normal"));
        tasks.add(task("guest-comms", "Messages & stay updates", unread > 0 ? unread + " unread alert(s)" : "Booking & payment notifications",
                "MessageSquare", "Open inbox", "/communications", unread > 0 ? "normal" : "low"));
        if (unread > 0) {
            tasks.add(task("guest-alerts", "Unread notifications", unread + " new alert(s)",
                    "Bell", "View alerts", "/communications", "normal"));
        }

        return new ApiDtos.RoleDashboardDto("guest", "Welcome to Net Luna Villa",
                "Your stay, payments, services & personalized offers in one place", kpis, tasks);
    }

    private ApiDtos.RoleDashboardDto receptionistDashboard() {
        UserAccount user = currentUser.requireUser();
        LocalDate today = LocalDate.now();
        var arrivals = workflowService.todayArrivals();
        var departures = workflowService.todayDepartures();
        long pendingCount = bookingRepository.countByStatus(BookingStatus.PENDING);
        long openMsgs = notificationRepository.countByUserIdAndReadFalse(user.getId());

        List<ApiDtos.KpiDto> kpis = List.of(
                new ApiDtos.KpiDto("arrivals", "Arrivals today", String.valueOf(arrivals.size()), null, "neutral", "LogIn"),
                new ApiDtos.KpiDto("departures", "Departures", String.valueOf(departures.size()), null, "neutral", "LogOut"),
                new ApiDtos.KpiDto("pending", "Pending bookings", String.valueOf(pendingCount), null, pendingCount > 0 ? "down" : "neutral", "Clock"));

        List<ApiDtos.RoleTaskDto> tasks = new ArrayList<>();
        addPendingBookingTasks(tasks);
        for (var b : arrivals.stream().limit(3).toList()) {
            tasks.add(task("arr-" + b.id(), "Check-in: " + b.guestName(),
                    b.room() + " · " + b.checkIn(), "DoorOpen", "Check-in desk", "/check-in-out", "high"));
        }
        for (var b : departures.stream().limit(2).toList()) {
            tasks.add(task("dep-" + b.id(), "Check-out: " + b.guestName(),
                    b.room() + " · depart " + b.checkOut(), "LogOut", "Process checkout", "/check-in-out", "high"));
        }
        tasks.add(task("recv-guests", "Guest directory", "Profiles, walk-ins & stay history",
                "Users", "Open guests", "/guests", "normal"));
        if (openMsgs > 0) {
            tasks.add(task("recv-msg", "Guest communications", openMsgs + " unread message(s)",
                    "MessageSquare", "Open inbox", "/communications", "normal"));
        }

        return new ApiDtos.RoleDashboardDto("receptionist", "Front desk operations",
                "Approve guest bookings, check-ins & departures — " + today, kpis, tasks);
    }

    private void addPendingBookingTasks(List<ApiDtos.RoleTaskDto> tasks) {
        List<Booking> pendingBookings = bookingRepository.findByStatus(BookingStatus.PENDING).stream()
                .sorted(Comparator.comparing(Booking::getCreatedAt).reversed())
                .limit(8)
                .toList();
        for (Booking b : pendingBookings) {
            tasks.add(task(
                    "pending-" + b.getBookingCode(),
                    "Approve booking: " + b.getGuestName(),
                    b.getBookingCode() + " · " + b.getRoomLabel() + " · " + b.getCheckIn() + " → "
                            + b.getCheckOut() + " · RWF " + b.getAmountRwf(),
                    "CalendarCheck",
                    "Approve / reject",
                    "/dashboard#pending-approvals",
                    "high"));
        }
    }

    private ApiDtos.RoleDashboardDto staffDashboard(UserAccount user) {
        List<ServiceRequest> all = serviceRepository.findAllByOrderByCreatedAtDesc();
        long open = all.stream().filter(s -> s.getStatus() == ServiceStatus.OPEN).count();
        long inProgress = all.stream().filter(s -> s.getStatus() == ServiceStatus.IN_PROGRESS).count();
        long myAssigned = all.stream()
                .filter(s -> user.getName().equals(s.getAssignedStaffName()))
                .filter(s -> s.getStatus() != ServiceStatus.COMPLETED)
                .count();
        long completedToday = all.stream()
                .filter(s -> s.getStatus() == ServiceStatus.COMPLETED)
                .count();

        List<ApiDtos.KpiDto> kpis = List.of(
                new ApiDtos.KpiDto("open", "Open requests", String.valueOf(open), null, "neutral", "ConciergeBell"),
                new ApiDtos.KpiDto("progress", "In progress", String.valueOf(inProgress), null, "neutral", "Loader"),
                new ApiDtos.KpiDto("mine", "Assigned to you", String.valueOf(myAssigned), null, "neutral", "UserCheck"));

        List<ApiDtos.RoleTaskDto> tasks = new ArrayList<>();
        all.stream()
                .filter(s -> s.getStatus() != ServiceStatus.COMPLETED)
                .limit(6)
                .forEach(s -> {
                    String label = s.getAssignedStaffName() != null
                            ? "Assigned: " + s.getAssignedStaffName()
                            : "Unassigned — claim in Services";
                    tasks.add(task("sr-" + s.getRequestCode(),
                            capitalize(s.getType().name()) + " — Room " + s.getRoom(),
                            label + " · " + s.getPriority().name().toLowerCase(),
                            iconForService(s.getType()),
                            "Open queue",
                            "/services",
                            s.getPriority() == Priority.HIGH ? "high" : "normal"));
                });

        if (tasks.isEmpty()) {
            tasks.add(task("staff-empty", "No open service requests", "New guest requests will appear here",
                    "CheckCircle2", "View services", "/services", "normal"));
        }

        return new ApiDtos.RoleDashboardDto("staff", "Operations board",
                "Housekeeping, room service & maintenance — " + completedToday + " completed", kpis, tasks);
    }

    private ApiDtos.RoleDashboardDto financeDashboard() {
        LocalDate today = LocalDate.now(ZoneId.of("Africa/Kigali"));
        long todayCollections = paymentRepository.findAll().stream()
                .filter(p -> p.getStatus() == PaymentStatus.COMPLETED)
                .filter(p -> p.getCreatedAt().atZone(ZoneId.of("Africa/Kigali")).toLocalDate().equals(today))
                .mapToLong(Payment::getAmountRwf)
                .sum();
        long pending = paymentRepository.findAll().stream()
                .filter(p -> p.getStatus() == PaymentStatus.PENDING)
                .mapToLong(Payment::getAmountRwf)
                .sum();
        long paypack = paymentRepository.findAll().stream()
                .filter(p -> p.getIremboReference() != null && p.getIremboReference().startsWith("PAYPACK"))
                .count();

        List<ApiDtos.KpiDto> kpis = List.of(
                new ApiDtos.KpiDto("collections", "Today's collections", formatRwf(todayCollections), null, "up", "Wallet"),
                new ApiDtos.KpiDto("pending", "Pending", formatRwf(pending), null, "neutral", "Clock"),
                new ApiDtos.KpiDto("paypack", "Paypack txns", String.valueOf(paypack), null, "neutral", "CreditCard"));

        List<ApiDtos.RoleTaskDto> tasks = new ArrayList<>();
        paymentRepository.findAll().stream()
                .filter(p -> p.getStatus() == PaymentStatus.PENDING)
                .limit(4)
                .forEach(p -> tasks.add(task("pay-" + p.getPaymentCode(),
                        "Process " + p.getPaymentCode(),
                        p.getGuestName() + " — RWF " + p.getAmountRwf(),
                        "CreditCard", "Open payments", "/payments", "high")));

        tasks.add(task("fin-reports", "Financial reports", "Revenue, occupancy & payment exports",
                "FileText", "Reports & Analytics", "/reports", "normal"));
        tasks.add(task("fin-reconcile", "Payment reconciliation", "Verify all completed transactions",
                "RefreshCw", "All transactions", "/payments", "normal"));

        return new ApiDtos.RoleDashboardDto("finance", "Finance desk",
                "Payments, reconciliation & reporting", kpis, tasks);
    }

    private ApiDtos.RoleDashboardDto managementDashboard() {
        ApiDtos.DashboardDto dash = analyticsService.dashboard();
        List<ApiDtos.KpiDto> kpis = dash.kpis().size() >= 3
                ? dash.kpis().subList(0, 3)
                : dash.kpis();

        List<ApiDtos.RoleTaskDto> tasks = new ArrayList<>();
        addPendingBookingTasks(tasks);
        tasks.add(task("mgmt-reports", "Reports & Analytics", "Occupancy, revenue & guest satisfaction KPIs",
                "BarChart3", "Open dashboard", "/reports", "high"));
        tasks.add(task("mgmt-guests", "Guest insights", "Profiles, tiers & preferences",
                "Users", "Guest directory", "/guests", "normal"));
        tasks.add(task("mgmt-ai", "AI personalization review", "Upsell recommendations & model stats",
                "Sparkles", "AI module", "/ai-personalization", "normal"));
        tasks.add(task("mgmt-users", "Staff accounts", "Create reception, finance & operations users",
                "UserCog", "User management", "/user-management", "normal"));

        return new ApiDtos.RoleDashboardDto("management", "Executive dashboard",
                "Approve guest bookings and review operational KPIs", kpis, tasks);
    }

    private ApiDtos.RoleDashboardDto adminDashboard() {
        List<ApiDtos.RoleTaskDto> tasks = List.of(
                task("adm-users", "User & role management", "Create accounts and assign permissions",
                        "UserCog", "User management", "/user-management", "high"),
                task("adm-security", "Security & audit logs", "Authentication, OTP & compliance",
                        "Shield", "Security center", "/security", "high"),
                task("adm-branches", "Multi-hotel branches", "Net Luna Villa locations & occupancy",
                        "Building2", "Branches", "/multi-hotel", "normal"),
                task("adm-reports", "System reports", "Revenue and operational exports",
                        "FileText", "Reports", "/reports", "normal"));

        List<ApiDtos.KpiDto> kpis = List.of(
                new ApiDtos.KpiDto("modules", "Active modules", "10", null, "neutral", "Layers"),
                new ApiDtos.KpiDto("roles", "Stakeholder roles", "6", null, "neutral", "Users"),
                new ApiDtos.KpiDto("status", "System", "Operational", null, "up", "Activity"));

        return new ApiDtos.RoleDashboardDto("admin", "System administration",
                "Full platform control — Net Luna Villa", kpis, tasks);
    }

    private static ApiDtos.RoleTaskDto task(
            String id, String title, String desc, String icon, String label, String path, String priority) {
        return new ApiDtos.RoleTaskDto(id, title, desc, icon, label, path, priority);
    }

    private static String formatRwf(long rwf) {
        if (rwf >= 1_000_000) return "RWF " + String.format("%.1fM", rwf / 1_000_000.0);
        if (rwf >= 1_000) return "RWF " + (rwf / 1_000) + "K";
        return "RWF " + rwf;
    }

    private static String capitalize(String s) {
        if (s == null || s.isEmpty()) return s;
        return s.charAt(0) + s.substring(1).toLowerCase().replace("_", " ");
    }

    private static String iconForService(ServiceType type) {
        return switch (type) {
            case HOUSEKEEPING -> "Sparkles";
            case ROOM_SERVICE -> "UtensilsCrossed";
            case MAINTENANCE -> "Wrench";
            case CONCIERGE -> "Car";
        };
    }
}
