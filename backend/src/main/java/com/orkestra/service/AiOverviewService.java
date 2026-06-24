package com.orkestra.service;

import com.orkestra.domain.entity.Booking;
import com.orkestra.domain.entity.GuestProfile;
import com.orkestra.domain.entity.Payment;
import com.orkestra.domain.entity.ServiceRequest;
import com.orkestra.domain.entity.UserAccount;
import com.orkestra.domain.enums.BookingStatus;
import com.orkestra.domain.enums.PaymentStatus;
import com.orkestra.domain.enums.RoomType;
import com.orkestra.domain.enums.ServiceType;
import com.orkestra.domain.enums.UserRole;
import com.orkestra.dto.ApiDtos;
import com.orkestra.repository.BookingRepository;
import com.orkestra.repository.BranchRepository;
import com.orkestra.repository.GuestProfileRepository;
import com.orkestra.repository.PaymentRepository;
import com.orkestra.repository.RecommendationRepository;
import com.orkestra.repository.ServiceRequestRepository;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.EnumMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.UUID;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class AiOverviewService {

    private static final int RATE_STANDARD = RoomRates.STANDARD;
    private static final int RATE_DELUXE = RoomRates.DELUXE;
    private static final int RATE_SUITE = RoomRates.SUITE;

    private final CurrentUserService currentUser;
    private final GuestProfileRepository guestProfileRepository;
    private final BookingRepository bookingRepository;
    private final ServiceRequestRepository serviceRepository;
    private final PaymentRepository paymentRepository;
    private final BranchRepository branchRepository;
    private final AnalyticsService analyticsService;
    private final RecommendationRepository recommendationRepository;
    private final PersonalizationService personalizationService;

    public AiOverviewService(
            CurrentUserService currentUser,
            GuestProfileRepository guestProfileRepository,
            BookingRepository bookingRepository,
            ServiceRequestRepository serviceRepository,
            PaymentRepository paymentRepository,
            BranchRepository branchRepository,
            AnalyticsService analyticsService,
            RecommendationRepository recommendationRepository,
            PersonalizationService personalizationService) {
        this.currentUser = currentUser;
        this.guestProfileRepository = guestProfileRepository;
        this.bookingRepository = bookingRepository;
        this.serviceRepository = serviceRepository;
        this.paymentRepository = paymentRepository;
        this.branchRepository = branchRepository;
        this.analyticsService = analyticsService;
        this.recommendationRepository = recommendationRepository;
        this.personalizationService = personalizationService;
    }

    @Transactional(readOnly = true)
    public ApiDtos.AiOverviewDto overview() {
        UserAccount user = currentUser.requireUser();
        boolean isGuest = user.getRole() == UserRole.GUEST;
        boolean isManagement = user.getRole() == UserRole.MANAGEMENT
                || user.getRole() == UserRole.ADMIN;

        GuestProfile profile = guestProfileRepository.findByUserId(user.getId()).orElse(null);
        List<Booking> guestBookings = isGuest
                ? bookingRepository.findByGuestUserIdOrderByCreatedAtDesc(user.getId())
                : List.of();
        List<ServiceRequest> guestServices = isGuest
                ? serviceRepository.findByGuestUserIdOrderByCreatedAtDesc(user.getId())
                : List.of();
        List<Payment> guestPayments = isGuest
                ? paymentRepository.findByGuestUserIdOrderByCreatedAtDesc(user.getId())
                : List.of();

        List<ApiDtos.AiPipelineStepDto> pipeline = buildPipeline(
                isGuest, profile, guestBookings, guestServices, guestPayments);

        ApiDtos.GuestAiAnalysisDto guestAnalysis = isGuest && profile != null
                ? analyzeGuest(user, profile, guestBookings, guestServices, guestPayments)
                : null;

        ApiDtos.ManagementAiInsightsDto managementInsights = isManagement
                ? buildManagementInsights()
                : null;

        return new ApiDtos.AiOverviewDto(pipeline, guestAnalysis, managementInsights);
    }

    private List<ApiDtos.AiPipelineStepDto> buildPipeline(
            boolean isGuest,
            GuestProfile profile,
            List<Booking> bookings,
            List<ServiceRequest> services,
            List<Payment> payments) {

        long totalBookings = isGuest ? bookings.size() : bookingRepository.count();
        long totalServices = isGuest ? services.size() : serviceRepository.count();
        long totalPayments = isGuest
                ? payments.stream().filter(p -> p.getStatus() == PaymentStatus.COMPLETED).count()
                : paymentRepository.findAll().stream()
                        .filter(p -> p.getStatus() == PaymentStatus.COMPLETED)
                        .count();

        var branch = branchRepository.findByCode("KIGALI").orElse(null);
        int totalRooms = branch != null ? branch.getTotalRooms() : 48;
        long occupiedToday = bookingRepository.countOccupiedOnDate(LocalDate.now());
        int occupancyPct = totalRooms > 0 ? (int) (occupiedToday * 100 / totalRooms) : 0;

        List<ApiDtos.AiPipelineStepDto> steps = new ArrayList<>();

        steps.add(step(
                "collect",
                "1. Data collection",
                "Bookings, preferences, payments, services, stays, and occupancy feed the AI engine.",
                List.of(
                        point("Guest bookings", String.valueOf(totalBookings)),
                        point("Service requests", String.valueOf(totalServices)),
                        point("Payment records", String.valueOf(totalPayments)),
                        point("Hotel rooms tracked", String.valueOf(totalRooms)),
                        point(
                                "Your preferences",
                                profile != null && !profile.getPreferences().isEmpty()
                                        ? String.join(", ", profile.getPreferences())
                                        : "None saved yet"))));

        steps.add(step(
                "analyze",
                "2. Data analysis",
                "AI finds patterns — room types, service habits, payment behaviour, and length of stay.",
                List.of(
                        point(
                                "Insight",
                                isGuest && !bookings.isEmpty()
                                        ? describeGuestPatterns(profile, bookings, services)
                                        : "Cross-guest booking and service trends at Net Luna Villa"),
                        point("Occupancy today", occupancyPct + "%"),
                        point("Trend data", analyticsService.occupancyWeek().size() + " days analyzed"))));

        long recCount = isGuest && profile != null
                ? recommendationRepository.findByGuestUserId(currentUser.requireUser().getId()).size()
                : personalizationService.stats().predictionsToday();

        steps.add(step(
                "recommend",
                "3. Personalized recommendations",
                "Offers match each guest — deluxe rooms, dining, spa, transport, and packages.",
                List.of(
                        point("Stored recommendations", String.valueOf(recCount)),
                        point("Data source", "Live PostgreSQL guest profiles"),
                        point("Example", "Returning guest → deluxe room + airport pickup + room service"))));

        steps.add(step(
                "predict",
                "4. Guest behaviour prediction",
                "Anticipates needs before the guest asks — transport, family rooms, evening dining.",
                List.of(
                        point(
                                "Your segment",
                                isGuest && profile != null
                                        ? detectSegment(profile, bookings, services)
                                        : "Business · Family · Leisure"),
                        point("Focus", "Next booking & in-stay services"),
                        point("Confidence range", "70–98% on suggestions"))));

        if (!isGuest) {
            steps.add(step(
                    "forecast",
                    "5. Occupancy forecasting",
                    "Historical bookings predict occupancy for staffing and room readiness.",
                    List.of(
                            point("Horizon", "Next 7 days"),
                            point("Current occupancy", occupancyPct + "%"),
                            point("Method", "Booking history + seasonal patterns"))));

            steps.add(step(
                    "pricing",
                    "6. Dynamic pricing",
                    "Suggested rates adjust for demand, season, and current occupancy.",
                    List.of(
                            point("Demand level", occupancyPct >= 70 ? "High" : occupancyPct >= 45 ? "Moderate" : "Low"),
                            point("Standard from", "RWF " + formatRwf(RATE_STANDARD)),
                            point("Deluxe from", "RWF " + formatRwf(RATE_DELUXE)))));

            steps.add(step(
                    "optimize",
                    "7. Service optimization",
                    "Peak request times guide housekeeping, room service, and maintenance staffing.",
                    List.of(
                            point("Requests analyzed", String.valueOf(totalServices)),
                            point("Focus", "Housekeeping · Room service · Maintenance"),
                            point("Action", "Align staff to peak demand windows"))));

            steps.add(step(
                    "insights",
                    "8. Management insights",
                    "Dashboards highlight trends, revenue signals, and operational performance.",
                    List.of(
                            point("Reports", "Reports & Analytics module"),
                            point("Revenue", "Payment & booking ledgers"),
                            point("Decisions", "Pricing, staffing, and guest packages"))));
        }

        return steps;
    }

    private ApiDtos.GuestAiAnalysisDto analyzeGuest(
            UserAccount guest,
            GuestProfile profile,
            List<Booking> bookings,
            List<ServiceRequest> services,
            List<Payment> payments) {

        RoomType preferred = preferredRoomType(bookings);
        String segment = detectSegment(profile, bookings, services);
        boolean returning = profile.getVisitCount() >= 2 || bookings.size() >= 2;

        List<ApiDtos.GuestPatternDto> patterns = new ArrayList<>();
        if (returning) {
            patterns.add(new ApiDtos.GuestPatternDto(
                    "Returning guest",
                    profile.getVisitCount() + " visit(s) — AI recognizes loyalty and past behaviour"));
        }
        if (preferred != null) {
            patterns.add(new ApiDtos.GuestPatternDto(
                    "Room preference",
                    "Usually books " + DtoMapper.capitalizeRoomType(preferred) + " rooms"));
        }
        long roomServiceCount = services.stream().filter(s -> s.getType() == ServiceType.ROOM_SERVICE).count();
        if (roomServiceCount > 0) {
            patterns.add(new ApiDtos.GuestPatternDto(
                    "Dining habit",
                    "Ordered room service " + roomServiceCount + " time(s) — evening meals likely"));
        }
        boolean airport = profile.getPreferences().stream().anyMatch(p -> p.toLowerCase().contains("airport"))
                || services.stream().anyMatch(s -> s.getDescription() != null
                        && s.getDescription().toLowerCase().contains("airport"));
        if (airport) {
            patterns.add(new ApiDtos.GuestPatternDto(
                    "Transport",
                    "Airport pickup requested before — business travel pattern"));
        }
        long completedPayments = payments.stream().filter(p -> p.getStatus() == PaymentStatus.COMPLETED).count();
        if (completedPayments > 0) {
            patterns.add(new ApiDtos.GuestPatternDto(
                    "Payments",
                    completedPayments + " completed payment(s) on file"));
        }

        List<ApiDtos.GuestPredictionDto> predictions = new ArrayList<>();
        if (returning && preferred == RoomType.DELUXE) {
            predictions.add(new ApiDtos.GuestPredictionDto(
                    "Deluxe room on next stay",
                    "Based on your previous deluxe bookings, we recommend reserving a deluxe room again.",
                    92));
        }
        if (airport) {
            predictions.add(new ApiDtos.GuestPredictionDto(
                    "Airport pickup",
                    "Offer Kigali International pickup when you book your next arrival.",
                    88));
        }
        if (roomServiceCount >= 1) {
            predictions.add(new ApiDtos.GuestPredictionDto(
                    "Evening room service package",
                    "Pre-order dinner tray — similar to your past in-room dining requests.",
                    85));
        }
        if ("Business".equals(segment)) {
            predictions.add(new ApiDtos.GuestPredictionDto(
                    "Meeting support",
                    "Quiet workspace, late checkout, and express breakfast may suit your travel style.",
                    80));
        }
        if ("Family".equals(segment)) {
            predictions.add(new ApiDtos.GuestPredictionDto(
                    "Family-friendly room",
                    "Connecting rooms or suite upgrade for extra space.",
                    83));
        }

        return new ApiDtos.GuestAiAnalysisDto(
                guest.getName(),
                returning,
                profile.getVisitCount(),
                preferred != null ? DtoMapper.capitalizeRoomType(preferred) : "—",
                segment,
                patterns,
                predictions);
    }

    private ApiDtos.ManagementAiInsightsDto buildManagementInsights() {
        List<ApiDtos.OccupancyForecastPointDto> forecast = new ArrayList<>();
        var week = analyticsService.occupancyWeek();
        for (int i = 0; i < week.size(); i++) {
            var p = week.get(i);
            int predicted = Math.min(100, (int) (p.occupancy() * 1.05));
            String trend = i > 0 && p.occupancy() > week.get(i - 1).occupancy() ? "rising" : "stable";
            forecast.add(new ApiDtos.OccupancyForecastPointDto(p.day(), predicted, trend));
        }

        var branch = branchRepository.findByCode("KIGALI").orElse(null);
        int totalRooms = branch != null ? branch.getTotalRooms() : 48;
        long occupied = bookingRepository.countOccupiedOnDate(LocalDate.now());
        int occPct = totalRooms > 0 ? (int) (occupied * 100 / totalRooms) : 0;

        List<ApiDtos.DynamicPriceDto> pricing = List.of(
                dynamicPrice("Standard", RATE_STANDARD, occPct),
                dynamicPrice("Deluxe", RATE_DELUXE, occPct),
                dynamicPrice("Suite", RATE_SUITE, occPct));

        Map<ServiceType, Long> byType = new EnumMap<>(ServiceType.class);
        serviceRepository.findAll().forEach(s -> byType.merge(s.getType(), 1L, Long::sum));

        List<ApiDtos.ServicePeakDto> serviceOpt = new ArrayList<>();
        byType.entrySet().stream()
                .sorted((a, b) -> Long.compare(b.getValue(), a.getValue()))
                .forEach(e -> serviceOpt.add(new ApiDtos.ServicePeakDto(
                        e.getKey().name().toLowerCase().replace("_", " "),
                        peakPeriodFor(e.getKey()),
                        e.getValue(),
                        staffRecommendation(e.getKey(), e.getValue()))));

        List<String> strategic = List.of(
                "Guests who book Deluxe and use airport pickup are strong candidates for bundled business packages.",
                "Room service demand peaks in the evening — align kitchen and floor staff accordingly.",
                occPct >= 70
                        ? "High occupancy: consider +10–15% dynamic rates on premium room types."
                        : "Lower occupancy: promotional rates on Standard rooms can lift bookings.");

        return new ApiDtos.ManagementAiInsightsDto(forecast, pricing, serviceOpt, strategic);
    }

    private ApiDtos.DynamicPriceDto dynamicPrice(String label, int base, int occupancyPct) {
        long suggested = base;
        String reason;
        if (occupancyPct >= 75) {
            suggested = Math.round(base * 1.12);
            reason = "High demand — rates elevated ~12%";
        } else if (occupancyPct < 45) {
            suggested = Math.round(base * 0.90);
            reason = "Low demand — promotional rate ~10% off";
        } else {
            reason = "Moderate demand — standard rate recommended";
        }
        return new ApiDtos.DynamicPriceDto(label, base, suggested, reason);
    }

    private RoomType preferredRoomType(List<Booking> bookings) {
        Map<RoomType, Long> counts = new EnumMap<>(RoomType.class);
        bookings.stream()
                .filter(b -> b.getStatus() != BookingStatus.CANCELLED)
                .forEach(b -> {
                    if (b.getRoomType() != null) {
                        counts.merge(b.getRoomType(), 1L, Long::sum);
                    }
                });
        return counts.entrySet().stream()
                .max(Map.Entry.comparingByValue())
                .map(Map.Entry::getKey)
                .orElse(null);
    }

    private String detectSegment(GuestProfile profile, List<Booking> bookings, List<ServiceRequest> services) {
        if (profile.getPreferences().stream().anyMatch(p -> {
            String l = p.toLowerCase(Locale.ROOT);
            return l.contains("airport") || l.contains("business") || l.contains("meeting");
        })) {
            return "Business";
        }
        if (services.stream().anyMatch(s -> s.getDescription() != null
                && s.getDescription().toLowerCase(Locale.ROOT).contains("airport"))) {
            return "Business";
        }
        int maxGuests = bookings.stream().mapToInt(Booking::getGuestCount).max().orElse(1);
        if (maxGuests >= 3) {
            return "Family";
        }
        return "Leisure";
    }

    private String describeGuestPatterns(
            GuestProfile profile, List<Booking> bookings, List<ServiceRequest> services) {
        RoomType pref = preferredRoomType(bookings);
        String prefStr = pref != null ? DtoMapper.capitalizeRoomType(pref) + " rooms" : "varied room types";
        long svc = services.size();
        return String.format(
                "%s tier · prefers %s · %d past booking(s) · %d service request(s)",
                profile.getTier().name().toLowerCase(Locale.ROOT),
                prefStr,
                bookings.size(),
                svc);
    }

    private String peakPeriodFor(ServiceType type) {
        return switch (type) {
            case HOUSEKEEPING -> "09:00–12:00";
            case ROOM_SERVICE -> "18:00–21:00";
            case MAINTENANCE -> "10:00–14:00";
            case CONCIERGE -> "All day";
        };
    }

    private String staffRecommendation(ServiceType type, long count) {
        if (count >= 5) {
            return "Assign extra staff during peak " + peakPeriodFor(type);
        }
        return "Monitor volume — current demand is moderate";
    }

    private static ApiDtos.AiDataPointDto point(String label, String value) {
        return new ApiDtos.AiDataPointDto(label, value);
    }

    private static ApiDtos.AiPipelineStepDto step(
            String id, String title, String summary, List<ApiDtos.AiDataPointDto> signals) {
        return new ApiDtos.AiPipelineStepDto(id, title, summary, signals, "active");
    }

    private static String formatRwf(long rwf) {
        if (rwf >= 1_000_000) return String.format("%.1fM", rwf / 1_000_000.0);
        if (rwf >= 1_000) return (rwf / 1_000) + "K";
        return String.valueOf(rwf);
    }
}
