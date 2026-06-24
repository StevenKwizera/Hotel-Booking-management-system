package com.orkestra.service;

import com.orkestra.domain.entity.Branch;
import com.orkestra.domain.entity.GuestProfile;
import com.orkestra.domain.entity.Recommendation;
import com.orkestra.domain.entity.UserAccount;
import com.orkestra.domain.enums.GuestTier;
import com.orkestra.domain.enums.UserRole;
import com.orkestra.dto.ApiDtos;
import com.orkestra.repository.BranchRepository;
import com.orkestra.repository.GuestProfileRepository;
import com.orkestra.repository.RecommendationRepository;
import com.orkestra.repository.UserAccountRepository;
import java.util.List;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class GuestService {

    private final GuestProfileRepository guestProfileRepository;
    private final RecommendationRepository recommendationRepository;
    private final PersonalizationService personalizationService;
    private final CurrentUserService currentUser;
    private final UserAccountRepository userRepository;
    private final BranchRepository branchRepository;
    private final PasswordEncoder passwordEncoder;
    private final AuditService auditService;
    private final AiOverviewService aiOverviewService;

    public GuestService(
            GuestProfileRepository guestProfileRepository,
            RecommendationRepository recommendationRepository,
            PersonalizationService personalizationService,
            CurrentUserService currentUser,
            UserAccountRepository userRepository,
            BranchRepository branchRepository,
            PasswordEncoder passwordEncoder,
            AuditService auditService,
            AiOverviewService aiOverviewService) {
        this.guestProfileRepository = guestProfileRepository;
        this.recommendationRepository = recommendationRepository;
        this.personalizationService = personalizationService;
        this.currentUser = currentUser;
        this.userRepository = userRepository;
        this.branchRepository = branchRepository;
        this.passwordEncoder = passwordEncoder;
        this.auditService = auditService;
        this.aiOverviewService = aiOverviewService;
    }

    public List<ApiDtos.GuestDto> listProfiles() {
        UserAccount actor = currentUser.requireUser();
        if (actor.getRole() != UserRole.ADMIN
                && actor.getRole() != UserRole.MANAGEMENT
                && actor.getRole() != UserRole.RECEPTIONIST) {
            throw new IllegalArgumentException("Not authorized to view guest profiles");
        }
        return guestProfileRepository.findAllByOrderByVisitCountDesc().stream()
                .map(DtoMapper::toGuest)
                .toList();
    }

    public List<ApiDtos.RecommendationDto> recommendations() {
        UserAccount user = currentUser.requireUser();
        if (recommendationRepository.findByGuestUserId(user.getId()).isEmpty()) {
            personalizationService.refreshForGuest(user);
        }
        return recommendationRepository.findByGuestUserIdAndAppliedFalseOrderByConfidenceDesc(user.getId())
                .stream()
                .map(DtoMapper::toRec)
                .toList();
    }

    public List<ApiDtos.GuestInsightDto> aiInsights() {
        return personalizationService.allInsights();
    }

    public ApiDtos.AiStatsDto aiStats() {
        return personalizationService.stats();
    }

    public ApiDtos.AiOverviewDto aiOverview() {
        return aiOverviewService.overview();
    }

    @Transactional
    public void refreshPersonalization() {
        UserAccount user = currentUser.requireUser();
        if (user.getRole() == UserRole.ADMIN || user.getRole() == UserRole.MANAGEMENT) {
            personalizationService.refreshAllGuests();
        } else {
            personalizationService.refreshForGuest(user);
        }
    }

    @Transactional
    public ApiDtos.RecommendationDto applyRec(String id) {
        Recommendation r = findRec(id);
        r.setApplied(true);
        return DtoMapper.toRec(recommendationRepository.save(r));
    }

    @Transactional
    public ApiDtos.RecommendationDto saveRec(String id) {
        Recommendation r = findRec(id);
        r.setSaved(true);
        return DtoMapper.toRec(recommendationRepository.save(r));
    }

    @Transactional
    public void updatePreferences(List<String> preferences) {
        UserAccount user = currentUser.requireUser();
        GuestProfile profile = guestProfileRepository.findByUserId(user.getId())
                .orElseThrow(() -> new IllegalArgumentException("Guest profile not found"));
        profile.setPreferences(preferences);
        guestProfileRepository.save(profile);
        personalizationService.refreshForGuest(user);
    }

    @Transactional
    public ApiDtos.GuestDto createWalkInGuest(ApiDtos.WalkInGuestRequest req) {
        UserAccount actor = currentUser.requireUser();
        if (actor.getRole() == UserRole.GUEST) {
            throw new IllegalArgumentException("Only staff can register walk-in guests");
        }
        String email = req.email().trim().toLowerCase();
        if (userRepository.existsByEmailIgnoreCase(email)) {
            throw new IllegalArgumentException("An account with this email already exists");
        }
        Branch branch = branchRepository.findByCode("KIGALI")
                .orElseThrow(() -> new IllegalArgumentException("Branch not found"));

        UserAccount user = new UserAccount();
        user.setName(req.name().trim());
        user.setEmail(email);
        user.setPasswordHash(passwordEncoder.encode("password123"));
        user.setRole(UserRole.GUEST);
        user.setBranch(branch);
        user = userRepository.save(user);

        GuestProfile profile = new GuestProfile();
        profile.setUser(user);
        profile.setPhone(req.phone() != null ? req.phone().trim() : "");
        profile.setTier(GuestTier.STANDARD);
        guestProfileRepository.save(profile);

        auditService.log(actor.getEmail(), "Walk-in guest registered: " + email);
        return DtoMapper.toGuest(profile);
    }

    private Recommendation findRec(String id) {
        return recommendationRepository.findById(java.util.UUID.fromString(id))
                .orElseThrow(() -> new IllegalArgumentException("Recommendation not found"));
    }
}
