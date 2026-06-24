package com.orkestra.config;

import com.orkestra.domain.entity.*;
import com.orkestra.domain.enums.*;
import com.orkestra.repository.*;
import com.orkestra.service.PersonalizationService;
import java.time.LocalDate;
import java.util.List;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

/**
 * Seeds Net Luna Villa Hotel (Kigali) with realistic operational data on first run.
 * All UI/API data is read from PostgreSQL after this runs.
 */
@Component
public class DataSeeder implements CommandLineRunner {

    private final UserAccountRepository userRepository;
    private final BranchRepository branchRepository;
    private final RoomRepository roomRepository;
    private final GuestProfileRepository guestProfileRepository;
    private final BookingRepository bookingRepository;
    private final PaymentRepository paymentRepository;
    private final ServiceRequestRepository serviceRepository;
    private final NotificationRepository notificationRepository;
    private final AuditLogRepository auditLogRepository;
    private final PersonalizationService personalizationService;
    private final PasswordEncoder passwordEncoder;

    public DataSeeder(
            UserAccountRepository userRepository,
            BranchRepository branchRepository,
            RoomRepository roomRepository,
            GuestProfileRepository guestProfileRepository,
            BookingRepository bookingRepository,
            PaymentRepository paymentRepository,
            ServiceRequestRepository serviceRepository,
            NotificationRepository notificationRepository,
            AuditLogRepository auditLogRepository,
            PersonalizationService personalizationService,
            PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.branchRepository = branchRepository;
        this.roomRepository = roomRepository;
        this.guestProfileRepository = guestProfileRepository;
        this.bookingRepository = bookingRepository;
        this.paymentRepository = paymentRepository;
        this.serviceRepository = serviceRepository;
        this.notificationRepository = notificationRepository;
        this.auditLogRepository = auditLogRepository;
        this.personalizationService = personalizationService;
        this.passwordEncoder = passwordEncoder;
    }

    @Override
    @Transactional
    public void run(String... args) {
        if (userRepository.count() > 0) return;

        Branch kigali = seedBranch("KIGALI", "Net Luna Villa — Kigali", "Kigali", 48, 78.0);
        seedBranch("MUSANZE", "Net Luna Villa — Musanze", "Musanze", 24, 62.0);
        seedBranch("HUYE", "Net Luna Villa — Huye", "Huye", 18, 45.0);

        List<Room> kigaliRooms = seedRooms(kigali);

        seedUser("Steve Gatanazi", "stevegatanazi@gmail.com", UserRole.ADMIN, kigali);
        seedUser("Alex Nkurunziza", "admin@orkestra.com", UserRole.ADMIN, kigali);
        seedUser("Claire Mukamana", "management@orkestra.com", UserRole.MANAGEMENT, kigali);
        seedUser("Jean Paul Habimana", "receptionist@orkestra.com", UserRole.RECEPTIONIST, kigali);
        seedUser("Grace Uwase", "staff@orkestra.com", UserRole.STAFF, kigali);
        seedUser("Eric Niyonsenga", "finance@orkestra.com", UserRole.FINANCE, kigali);

        UserAccount guest1 = seedGuest(
                "Marie Claire Uwimana",
                "guest@orkestra.com",
                "+250 788 123 456",
                GuestTier.PLATINUM,
                12,
                120000,
                List.of("Late checkout", "Quiet room", "Vegetarian breakfast"),
                kigali);

        UserAccount guest2 = seedGuest(
                "Patrick Nshimiyimana",
                "patrick.nshimi@email.com",
                "+250 722 445 901",
                GuestTier.GOLD,
                6,
                0,
                List.of("Airport pickup", "Extra pillows"),
                kigali);

        Room suite301 = kigaliRooms.stream()
                .filter(r -> "301".equals(r.getRoomNumber()))
                .findFirst()
                .orElse(kigaliRooms.get(kigaliRooms.size() - 1));

        Room deluxe205 = kigaliRooms.stream()
                .filter(r -> "205".equals(r.getRoomNumber()))
                .findFirst()
                .orElse(kigaliRooms.get(20));

        LocalDate today = LocalDate.now();

        Booking activeStay = saveBooking(
                "BK-1042",
                guest1,
                guest1.getName(),
                guest1.getEmail(),
                suite301,
                "Suite 301",
                RoomType.SUITE,
                2,
                today.minusDays(2),
                today.plusDays(1),
                BookingStatus.CHECKED_IN,
                com.orkestra.service.RoomRates.SUITE * 3L,
                kigali);

        saveBooking(
                "BK-1043",
                guest2,
                guest2.getName(),
                guest2.getEmail(),
                deluxe205,
                "Deluxe 205",
                RoomType.DELUXE,
                1,
                today,
                today.plusDays(3),
                BookingStatus.CONFIRMED,
                com.orkestra.service.RoomRates.DELUXE * 3L,
                kigali);

        saveBooking(
                "BK-1038",
                null,
                "Sandrine Uwase",
                "sandrine.u@email.com",
                null,
                "Standard 112",
                RoomType.STANDARD,
                2,
                today.plusDays(1),
                today.plusDays(4),
                BookingStatus.PENDING,
                com.orkestra.service.RoomRates.STANDARD * 3L,
                kigali);

        saveBooking(
                "BK-1044",
                null,
                "Jean Paul Niyonsaba",
                "jp.niyonsaba@email.com",
                null,
                "Deluxe 210",
                RoomType.DELUXE,
                2,
                today,
                today.plusDays(2),
                BookingStatus.PENDING,
                com.orkestra.service.RoomRates.DELUXE * 2L,
                kigali);

        saveBooking(
                "BK-1035",
                null,
                "David Hakizimana",
                "david.h@email.com",
                null,
                "Deluxe 208",
                RoomType.DELUXE,
                2,
                today.minusDays(5),
                today.minusDays(2),
                BookingStatus.CHECKED_OUT,
                com.orkestra.service.RoomRates.DELUXE * 3L,
                kigali);

        savePayment("PAY-8818", guest1, guest1.getName(), activeStay, 15, PaymentMethod.PAYPACK, PaymentStatus.COMPLETED, "PAYPACK-NLV-8818");
        savePayment("PAY-8819", guest1, guest1.getName(), activeStay, 27, PaymentMethod.PAYPACK, PaymentStatus.COMPLETED, "PAYPACK-NLV-8819");
        savePayment("PAY-8820", guest2, guest2.getName(), null, 7, PaymentMethod.PAYPACK, PaymentStatus.PENDING, null);
        savePayment("PAY-8821", guest2, guest2.getName(), null, 5, PaymentMethod.PAYPACK, PaymentStatus.FLAGGED, "SUSPICIOUS-DUP");

        saveService("SR-G01", ServiceType.ROOM_SERVICE, "301", "Breakfast tray — croissants, Rwandan coffee & tropical fruit", ServiceStatus.IN_PROGRESS, Priority.HIGH, guest1, kigali);
        saveService("SR-G02", ServiceType.HOUSEKEEPING, "301", "Evening turndown with local tea", ServiceStatus.OPEN, Priority.MEDIUM, guest1, kigali);
        saveService("SR-88", ServiceType.HOUSEKEEPING, "205", "Full room clean before guest arrival", ServiceStatus.IN_PROGRESS, Priority.MEDIUM, guest2, kigali);
        saveService("SR-90", ServiceType.MAINTENANCE, "112", "AC filter check before check-in", ServiceStatus.OPEN, Priority.LOW, null, kigali);
        saveService("SR-91", ServiceType.CONCIERGE, "301", "Airport pickup May 20 — Kigali International", ServiceStatus.COMPLETED, Priority.HIGH, guest1, kigali);

        UserAccount staffUser = userRepository.findByEmailIgnoreCase("staff@orkestra.com").orElse(null);
        if (staffUser != null) {
            saveNotif(staffUser, "New service task", "SR-G02 — HOUSEKEEPING Room 301 (medium priority)",
                    NotificationCategory.SERVICE, false);
            saveNotif(staffUser, "Task assigned to you", "SR-G01 — ROOM_SERVICE Room 301 — breakfast tray",
                    NotificationCategory.SERVICE, false);
        }

        serviceRepository.findAll().stream()
                .filter(s -> "SR-G01".equals(s.getRequestCode()))
                .findFirst()
                .ifPresent(s -> {
                    s.setAssignedStaffName("Grace Uwase");
                    serviceRepository.save(s);
                });

        saveAudit("staff@orkestra.com", "Service assigned: SR-G01 → Grace Uwase (ROOM_SERVICE Room 301)");
        saveAudit("staff@orkestra.com", "Service status updated: SR-G01 → in_progress");
        saveAudit("staff@orkestra.com", "Service completed: SR-91 — CONCIERGE Room 301");

        seedNotifications(guest1, activeStay);
        seedNotifications(guest2, null);

        saveAudit("system", "Database seeded — Net Luna Villa Kigali (AUCA / Orkestra HMS)");
        saveAudit("admin@orkestra.com", "Initial security policy applied — JWT + role-based access");
        saveAudit("receptionist@orkestra.com", "Checked in guest Marie Claire Uwimana — Suite 301");

        markRoomsOccupied(suite301, deluxe205);

        personalizationService.refreshAllGuests();
    }

    private Branch seedBranch(String code, String name, String city, int rooms, double occ) {
        Branch b = new Branch();
        b.setCode(code);
        b.setName(name);
        b.setCity(city);
        b.setTotalRooms(rooms);
        b.setOccupancyPercent(occ);
        b.setStatus(code.equals("HUYE") ? "maintenance" : "active");
        return branchRepository.save(b);
    }

    private List<Room> seedRooms(Branch branch) {
        java.util.ArrayList<Room> rooms = new java.util.ArrayList<>();
        int n = 1;
        for (int i = 0; i < 20; i++, n++) {
            rooms.add(saveRoom(branch, String.format("%03d", 100 + n), RoomType.STANDARD, com.orkestra.service.RoomRates.STANDARD));
        }
        for (int i = 0; i < 18; i++) {
            rooms.add(saveRoom(branch, String.format("%03d", 200 + i + 1), RoomType.DELUXE, com.orkestra.service.RoomRates.DELUXE));
        }
        for (int i = 0; i < 10; i++) {
            rooms.add(saveRoom(branch, String.format("%03d", 300 + i + 1), RoomType.SUITE, com.orkestra.service.RoomRates.SUITE));
        }
        return rooms;
    }

    private Room saveRoom(Branch branch, String num, RoomType type, int rate) {
        Room r = new Room();
        r.setBranch(branch);
        r.setRoomNumber(num);
        r.setRoomType(type);
        r.setNightlyRate(rate);
        r.setAvailable(true);
        return roomRepository.save(r);
    }

    private void markRoomsOccupied(Room... rooms) {
        for (Room room : rooms) {
            room.setAvailable(false);
            roomRepository.save(room);
        }
    }

    private UserAccount seedUser(String name, String email, UserRole role, Branch branch) {
        UserAccount u = new UserAccount();
        u.setName(name);
        u.setEmail(email);
        u.setPasswordHash(passwordEncoder.encode("password123"));
        u.setRole(role);
        u.setBranch(branch);
        return userRepository.save(u);
    }

    private UserAccount seedGuest(
            String name,
            String email,
            String phone,
            GuestTier tier,
            int visits,
            long balance,
            List<String> preferences,
            Branch branch) {
        UserAccount u = seedUser(name, email, UserRole.GUEST, branch);
        GuestProfile g = new GuestProfile();
        g.setUser(u);
        g.setPhone(phone);
        g.setTier(tier);
        g.setVisitCount(visits);
        g.setBalanceRwf(balance);
        g.setPreferences(preferences);
        guestProfileRepository.save(g);
        u.setGuestProfile(g);
        return u;
    }

    private Booking saveBooking(
            String code,
            UserAccount guestUser,
            String guestName,
            String guestEmail,
            Room room,
            String roomLabel,
            RoomType roomType,
            int guestCount,
            LocalDate checkIn,
            LocalDate checkOut,
            BookingStatus status,
            long amount,
            Branch branch) {
        Booking b = new Booking();
        b.setBookingCode(code);
        b.setGuestUser(guestUser);
        b.setGuestName(guestName);
        b.setGuestEmail(guestEmail);
        b.setRoom(room);
        b.setRoomLabel(roomLabel);
        b.setRoomType(roomType);
        b.setGuestCount(guestCount);
        b.setCheckIn(checkIn);
        b.setCheckOut(checkOut);
        b.setStatus(status);
        b.setAmountRwf(amount);
        b.setBranch(branch);
        return bookingRepository.save(b);
    }

    private void savePayment(
            String code,
            UserAccount guest,
            String guestName,
            Booking booking,
            long amount,
            PaymentMethod method,
            PaymentStatus status,
            String iremboRef) {
        Payment p = new Payment();
        p.setPaymentCode(code);
        p.setGuestUser(guest);
        p.setGuestName(guestName);
        p.setBooking(booking);
        p.setAmountRwf(amount);
        p.setMethod(method);
        p.setStatus(status);
        p.setIremboReference(iremboRef);
        paymentRepository.save(p);
    }

    private void saveService(
            String code,
            ServiceType type,
            String room,
            String description,
            ServiceStatus status,
            Priority priority,
            UserAccount guest,
            Branch branch) {
        ServiceRequest sr = new ServiceRequest();
        sr.setRequestCode(code);
        sr.setType(type);
        sr.setRoom(room);
        sr.setDescription(description);
        sr.setStatus(status);
        sr.setPriority(priority);
        if (guest != null) {
            sr.setGuestUser(guest);
            sr.setGuestEmail(guest.getEmail());
        }
        sr.setBranch(branch);
        serviceRepository.save(sr);
    }

    private void seedNotifications(UserAccount guest, Booking activeStay) {
        if (activeStay != null) {
            saveNotif(guest, "Booking confirmed", String.format(
                    "%s · %s to %s · %d guests — Net Luna Villa Kigali",
                    activeStay.getRoomLabel(),
                    activeStay.getCheckIn(),
                    activeStay.getCheckOut(),
                    activeStay.getGuestCount()), NotificationCategory.BOOKING, true);
            saveNotif(guest, "Checked in", String.format(
                    "Welcome to %s. Wi‑Fi and room service are available 24/7.",
                    activeStay.getRoomLabel()), NotificationCategory.BOOKING, true);
        }
        saveNotif(guest, "Payment received", "RWF 165,000 via Paypack — receipt PAY-8818", NotificationCategory.PAYMENT, true);
        saveNotif(guest, "Service update", "Room service SR-G01 is being prepared for Suite 301", NotificationCategory.SERVICE, false);
        saveNotif(guest, "AI recommendation ready", "Personalized offers generated from your stay profile", NotificationCategory.RECOMMENDATION, false);
        saveNotif(guest, "Checkout reminder", activeStay != null
                ? String.format("%s checkout %s before 11:00", activeStay.getRoomLabel(), activeStay.getCheckOut())
                : "Review your checkout date in Reservations", NotificationCategory.CHECKOUT, false);
    }

    private void saveNotif(UserAccount user, String title, String body, NotificationCategory cat, boolean read) {
        Notification n = new Notification();
        n.setUser(user);
        n.setTitle(title);
        n.setBody(body);
        n.setCategory(cat);
        n.setRead(read);
        notificationRepository.save(n);
    }

    private void saveAudit(String actor, String action) {
        AuditLog log = new AuditLog();
        log.setActorEmail(actor);
        log.setAction(action);
        auditLogRepository.save(log);
    }
}
