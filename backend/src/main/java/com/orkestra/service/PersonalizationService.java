package com.orkestra.service;

import com.orkestra.domain.entity.Booking;
import com.orkestra.domain.entity.GuestProfile;
import com.orkestra.domain.entity.Recommendation;
import com.orkestra.domain.entity.ServiceRequest;
import com.orkestra.domain.entity.UserAccount;
import com.orkestra.domain.enums.BookingStatus;
import com.orkestra.domain.enums.GuestTier;
import com.orkestra.domain.enums.RoomType;
import com.orkestra.domain.enums.ServiceType;
import com.orkestra.dto.ApiDtos;
import com.orkestra.repository.BookingRepository;
import com.orkestra.repository.GuestProfileRepository;
import com.orkestra.repository.RecommendationRepository;
import com.orkestra.repository.ServiceRequestRepository;
import com.orkestra.repository.UserAccountRepository;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.Locale;
import java.util.EnumMap;
import java.util.Map;
import java.util.Optional;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Generates recommendations from real guest data stored in PostgreSQL
 * (profile, bookings, balance, service history, tier).
 */
@Service
public class PersonalizationService {

    private static final DateTimeFormatter DATE_FMT =
            DateTimeFormatter.ofPattern("d MMM yyyy", Locale.ENGLISH);

    private final UserAccountRepository userRepository;
    private final GuestProfileRepository guestProfileRepository;
    private final BookingRepository bookingRepository;
    private final ServiceRequestRepository serviceRepository;
    private final RecommendationRepository recommendationRepository;

    public PersonalizationService(
            UserAccountRepository userRepository,
            GuestProfileRepository guestProfileRepository,
            BookingRepository bookingRepository,
            ServiceRequestRepository serviceRepository,
            RecommendationRepository recommendationRepository) {
        this.userRepository = userRepository;
        this.guestProfileRepository = guestProfileRepository;
        this.bookingRepository = bookingRepository;
        this.serviceRepository = serviceRepository;
        this.recommendationRepository = recommendationRepository;
    }

    @Transactional
    public void refreshAllGuests() {
        userRepository.findAll().stream()
                .filter(u -> u.getRole().name().equals("GUEST"))
                .forEach(this::refreshForGuest);
    }

    @Transactional
    public void refreshForGuest(UserAccount guest) {
        recommendationRepository.deleteByGuestUserId(guest.getId());
        GuestProfile profile = guestProfileRepository.findByUserId(guest.getId()).orElse(null);
        if (profile == null) return;

        List<Booking> bookings = bookingRepository.findByGuestUserIdOrderByCreatedAtDesc(guest.getId());
        List<ServiceRequest> services = serviceRepository.findByGuestUserIdOrderByCreatedAtDesc(guest.getId());

        List<Recommendation> generated = new ArrayList<>();

        RoomType preferredType = preferredRoomType(bookings);
        boolean returning = profile.getVisitCount() >= 2 || bookings.size() >= 2;
        boolean airportHistory = hasAirportHistory(profile, services);
        boolean roomServiceHistory = services.stream().anyMatch(s -> s.getType() == ServiceType.ROOM_SERVICE);

        if (returning && preferredType == RoomType.DELUXE) {
            generated.add(buildDeluxeReturnRecommendation(guest, profile));
        }
        if (returning && airportHistory) {
            generated.add(buildAirportPickupRecommendation(guest, profile));
        }
        if (roomServiceHistory) {
            generated.add(buildRoomServicePackageRecommendation(guest, services));
        }

        Optional<Booking> activeStay = bookings.stream()
                .filter(b -> b.getStatus() == BookingStatus.CHECKED_IN
                        || b.getStatus() == BookingStatus.CONFIRMED)
                .filter(b -> !b.getCheckOut().isBefore(LocalDate.now()))
                .findFirst();

        activeStay.ifPresent(b -> {
            generated.add(buildStayRecommendation(guest, profile, b));
            if (b.getRoomType() == RoomType.SUITE || b.getRoomType() == RoomType.DELUXE) {
                generated.add(buildSpaRecommendation(guest, b));
            }
        });

        if (profile.getBalanceRwf() > 0) {
            generated.add(buildBalanceRecommendation(guest, profile, activeStay.orElse(null)));
        }

        if (profile.getTier() == GuestTier.PLATINUM || profile.getTier() == GuestTier.GOLD) {
            activeStay.ifPresent(b -> generated.add(buildLateCheckoutRecommendation(guest, profile, b)));
        }

        if (hasPreference(profile, "vegetarian") || hasPreference(profile, "vegan")) {
            generated.add(buildDiningRecommendation(guest, profile));
        }

        if (hasPreference(profile, "quiet")) {
            generated.add(buildQuietRoomRecommendation(guest, profile));
        }

        if (services.stream().anyMatch(s -> s.getType() == ServiceType.ROOM_SERVICE)) {
            generated.add(buildRoomServiceFollowUp(guest, services));
        }

        if (profile.getVisitCount() >= 5) {
            generated.add(buildLoyaltyRecommendation(guest, profile));
        }

        if (generated.isEmpty()) {
            generated.add(buildWelcomeRecommendation(guest, profile));
        }

        generated.stream()
                .sorted(Comparator.comparingInt(Recommendation::getConfidence).reversed())
                .limit(6)
                .forEach(recommendationRepository::save);
    }

    @Transactional(readOnly = true)
    public List<ApiDtos.GuestInsightDto> allInsights() {
        return recommendationRepository.findAllByOrderByConfidenceDesc().stream()
                .map(r -> new ApiDtos.GuestInsightDto(
                        r.getId().toString(),
                        r.getGuestUser().getName(),
                        r.getDescription(),
                        r.getConfidence(),
                        r.getTitle()))
                .toList();
    }

    public ApiDtos.AiStatsDto stats() {
        List<Recommendation> all = recommendationRepository.findAll();
        int avg = all.isEmpty()
                ? 0
                : (int) all.stream().mapToInt(Recommendation::getConfidence).average().orElse(0);
        long guestsWithRecs = all.stream()
                .map(r -> r.getGuestUser().getId())
                .distinct()
                .count();
        return new ApiDtos.AiStatsDto(3, (int) guestsWithRecs, avg);
    }

    private Recommendation buildStayRecommendation(UserAccount guest, GuestProfile profile, Booking b) {
        long nights = ChronoUnit.DAYS.between(b.getCheckIn(), b.getCheckOut());
        String room = b.getRoomLabel() != null ? b.getRoomLabel() : b.getRoomType().name();
        Recommendation r = base(guest);
        r.setTitle("Extend your stay at Net Luna Villa");
        r.setDescription(String.format(
                "%s, you are in %s until %s (%d night%s). Add an extra night from RWF %,d/night based on your %s room type.",
                firstName(guest.getName()),
                room,
                DATE_FMT.format(b.getCheckOut()),
                nights,
                nights == 1 ? "" : "s",
                nightlyRate(b.getRoomType()),
                b.getRoomType().name().toLowerCase(Locale.ROOT)));
        r.setConfidence(clamp(78 + (int) nights * 2));
        return r;
    }

    private Recommendation buildSpaRecommendation(UserAccount guest, Booking b) {
        Recommendation r = base(guest);
        r.setTitle("Luna Wellness — couples spa");
        r.setDescription(String.format(
                "Suite/Deluxe guest in %s: 20%% off the Akagera Stone Massage today. Your booking %s is active through %s.",
                b.getRoomLabel() != null ? b.getRoomLabel() : "your room",
                b.getBookingCode(),
                DATE_FMT.format(b.getCheckOut())));
        r.setConfidence(91);
        return r;
    }

    private Recommendation buildBalanceRecommendation(
            UserAccount guest, GuestProfile profile, Booking booking) {
        Recommendation r = base(guest);
        String checkout = booking != null
                ? DATE_FMT.format(booking.getCheckOut())
                : "your departure";
        r.setTitle("Settle outstanding balance");
        r.setDescription(String.format(
                "%s, your account shows RWF %,d due at Net Luna Villa Kigali before checkout on %s. Pay via Paypack MoMo in the Payments module.",
                firstName(guest.getName()),
                profile.getBalanceRwf(),
                checkout));
        r.setConfidence(94);
        return r;
    }

    private Recommendation buildLateCheckoutRecommendation(
            UserAccount guest, GuestProfile profile, Booking b) {
        Recommendation r = base(guest);
        r.setTitle("Complimentary late checkout");
        r.setDescription(String.format(
                "%s tier (%d visits): extend checkout on %s from 11:00 to 14:00 at no charge for %s.",
                profile.getTier().name(),
                profile.getVisitCount(),
                DATE_FMT.format(b.getCheckOut()),
                b.getRoomLabel() != null ? b.getRoomLabel() : b.getBookingCode()));
        r.setConfidence(profile.getTier() == GuestTier.PLATINUM ? 93 : 87);
        return r;
    }

    private Recommendation buildDiningRecommendation(UserAccount guest, GuestProfile profile) {
        Recommendation r = base(guest);
        r.setTitle("Luna Terrace — plant-based chef's menu");
        r.setDescription(String.format(
                "Based on your saved preferences (%s), tonight's vegetarian Rwandan fusion tasting at Luna Terrace has availability at 19:30.",
                String.join(", ", profile.getPreferences())));
        r.setConfidence(89);
        return r;
    }

    private Recommendation buildQuietRoomRecommendation(UserAccount guest, GuestProfile profile) {
        Recommendation r = base(guest);
        r.setTitle("Quiet-floor turndown service");
        r.setDescription(String.format(
                "Preference \"%s\" noted on your profile — we can assign a north-wing room and disable corridor announcements after 21:00.",
                profile.getPreferences().stream()
                        .filter(p -> p.toLowerCase(Locale.ROOT).contains("quiet"))
                        .findFirst()
                        .orElse("Quiet room")));
        r.setConfidence(82);
        return r;
    }

    private Recommendation buildRoomServiceFollowUp(UserAccount guest, List<ServiceRequest> services) {
        ServiceRequest last = services.get(0);
        Recommendation r = base(guest);
        r.setTitle("Evening amenity upgrade");
        r.setDescription(String.format(
                "You ordered %s for room %s (%s). Add complimentary local tea and fruit at turndown?",
                last.getDescription(),
                last.getRoom(),
                last.getRequestCode()));
        r.setConfidence(84);
        return r;
    }

    private Recommendation buildLoyaltyRecommendation(UserAccount guest, GuestProfile profile) {
        Recommendation r = base(guest);
        r.setTitle("Returning guest reward");
        r.setDescription(String.format(
                "%s, thank you for %d stays at Net Luna Villa. Your next booking receives 10%% off when booked 7+ days in advance.",
                firstName(guest.getName()),
                profile.getVisitCount()));
        r.setConfidence(80);
        return r;
    }

    private Recommendation buildWelcomeRecommendation(UserAccount guest, GuestProfile profile) {
        Recommendation r = base(guest);
        r.setTitle("Discover Net Luna Villa Kigali");
        r.setDescription(String.format(
                "Welcome %s. Explore our Kigali City tour (hotel pickup) or Luna Terrace dining — both rated highly by %s guests.",
                firstName(guest.getName()),
                profile.getTier().name().toLowerCase(Locale.ROOT)));
        r.setConfidence(75);
        return r;
    }

    private Recommendation buildDeluxeReturnRecommendation(UserAccount guest, GuestProfile profile) {
        Recommendation r = base(guest);
        r.setTitle("Your preferred Deluxe room");
        r.setDescription(String.format(
                "%s, you have stayed with us %d time(s) and usually choose Deluxe rooms. "
                        + "Reserve a Deluxe on your next visit — AI matched to your history.",
                firstName(guest.getName()),
                Math.max(profile.getVisitCount(), 1)));
        r.setConfidence(92);
        return r;
    }

    private Recommendation buildAirportPickupRecommendation(UserAccount guest, GuestProfile profile) {
        Recommendation r = base(guest);
        r.setTitle("Kigali airport pickup");
        r.setDescription(String.format(
                "%s, based on your past airport transfers, add pickup from Kigali International when you book — "
                        + "complimentary for %s guests on stays of 2+ nights.",
                firstName(guest.getName()),
                profile.getTier().name().toLowerCase(Locale.ROOT)));
        r.setConfidence(88);
        return r;
    }

    private Recommendation buildRoomServicePackageRecommendation(UserAccount guest, List<ServiceRequest> services) {
        Recommendation r = base(guest);
        r.setTitle("Evening room service package");
        r.setDescription(String.format(
                "%s, you often order room service in the evening. Pre-book a dinner tray package for your next stay — "
                        + "15%% off when added at booking.",
                firstName(guest.getName())));
        r.setConfidence(86);
        return r;
    }

    private boolean hasAirportHistory(GuestProfile profile, List<ServiceRequest> services) {
        if (hasPreference(profile, "airport")) return true;
        return services.stream().anyMatch(s -> s.getType() == ServiceType.CONCIERGE
                || (s.getDescription() != null
                        && s.getDescription().toLowerCase(Locale.ROOT).contains("airport")));
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

    private Recommendation base(UserAccount guest) {
        Recommendation r = new Recommendation();
        r.setGuestUser(guest);
        r.setApplied(false);
        r.setSaved(false);
        return r;
    }

    private boolean hasPreference(GuestProfile profile, String keyword) {
        return profile.getPreferences().stream()
                .anyMatch(p -> p.toLowerCase(Locale.ROOT).contains(keyword));
    }

    private int nightlyRate(RoomType type) {
        return switch (type) {
            case STANDARD -> RoomRates.STANDARD;
            case DELUXE -> RoomRates.DELUXE;
            case SUITE -> RoomRates.SUITE;
        };
    }

    private int clamp(int value) {
        return Math.min(98, Math.max(70, value));
    }

    private String firstName(String fullName) {
        if (fullName == null || fullName.isBlank()) return "Guest";
        return fullName.split("\\s+")[0];
    }
}
