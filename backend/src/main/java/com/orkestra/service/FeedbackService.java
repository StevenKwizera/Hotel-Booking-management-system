package com.orkestra.service;

import com.orkestra.domain.entity.GuestFeedback;
import com.orkestra.domain.entity.Notification;
import com.orkestra.domain.entity.UserAccount;
import com.orkestra.domain.enums.FeedbackCategory;
import com.orkestra.domain.enums.NotificationCategory;
import com.orkestra.domain.enums.UserRole;
import com.orkestra.dto.ApiDtos;
import com.orkestra.repository.GuestFeedbackRepository;
import com.orkestra.repository.NotificationRepository;
import com.orkestra.repository.UserAccountRepository;
import java.time.Instant;
import java.util.List;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

@Service
public class FeedbackService {

    private final GuestFeedbackRepository feedbackRepository;
    private final NotificationRepository notificationRepository;
    private final UserAccountRepository userAccountRepository;
    private final CurrentUserService currentUser;
    private final AuditService auditService;

    public FeedbackService(
            GuestFeedbackRepository feedbackRepository,
            NotificationRepository notificationRepository,
            UserAccountRepository userAccountRepository,
            CurrentUserService currentUser,
            AuditService auditService) {
        this.feedbackRepository = feedbackRepository;
        this.notificationRepository = notificationRepository;
        this.userAccountRepository = userAccountRepository;
        this.currentUser = currentUser;
        this.auditService = auditService;
    }

    public List<ApiDtos.FeedbackDto> list() {
        UserAccount user = currentUser.requireUser();
        if (user.getRole() == UserRole.GUEST) {
            return feedbackRepository.findByGuestUserIdOrderByCreatedAtDesc(user.getId()).stream()
                    .map(DtoMapper::toFeedback)
                    .toList();
        }
        if (canViewAllFeedback(user.getRole())) {
            return feedbackRepository.findAllByOrderByCreatedAtDesc().stream()
                    .map(DtoMapper::toFeedback)
                    .toList();
        }
        throw new IllegalArgumentException("Your role cannot view guest feedback");
    }

    @Transactional
    public ApiDtos.FeedbackDto submit(ApiDtos.SubmitFeedbackRequest req) {
        UserAccount user = currentUser.requireUser();
        if (user.getRole() != UserRole.GUEST) {
            throw new IllegalArgumentException("Only guests can submit feedback through this form");
        }
        if (req.rating() < 1 || req.rating() > 5) {
            throw new IllegalArgumentException("Rating must be between 1 and 5 stars");
        }
        if (!StringUtils.hasText(req.message()) || req.message().trim().length() < 10) {
            throw new IllegalArgumentException("Please write at least 10 characters of feedback");
        }

        GuestFeedback fb = new GuestFeedback();
        fb.setFeedbackCode("FB-" + System.currentTimeMillis() % 100000);
        fb.setGuestUser(user);
        fb.setGuestName(user.getName());
        fb.setGuestEmail(user.getEmail());
        fb.setRoom(StringUtils.hasText(req.room()) ? req.room().trim() : null);
        fb.setRating(req.rating());
        fb.setCategory(parseCategory(req.category()));
        fb.setSubject(StringUtils.hasText(req.subject()) ? req.subject().trim() : null);
        fb.setMessage(req.message().trim());
        fb = feedbackRepository.save(fb);

        notifyStaff(fb);
        notifyGuest(user, fb);
        auditService.log(user.getEmail(),
                "Guest feedback submitted: " + fb.getFeedbackCode() + " — " + fb.getRating() + " stars");

        return DtoMapper.toFeedback(fb);
    }

    @Transactional
    public ApiDtos.FeedbackDto reply(String feedbackCode, ApiDtos.ReplyFeedbackRequest req) {
        UserAccount staff = currentUser.requireUser();
        if (!canReplyToFeedback(staff.getRole())) {
            throw new IllegalArgumentException("Only reception, management, or admin can reply to guest feedback");
        }
        if (!StringUtils.hasText(req.message()) || req.message().trim().length() < 5) {
            throw new IllegalArgumentException("Please write at least 5 characters in your reply");
        }

        GuestFeedback fb = feedbackRepository.findByFeedbackCode(feedbackCode)
                .orElseThrow(() -> new IllegalArgumentException("Feedback not found: " + feedbackCode));

        fb.setStaffReply(req.message().trim());
        fb.setRepliedByName(staff.getName());
        fb.setRepliedAt(Instant.now());
        fb = feedbackRepository.save(fb);

        notifyGuestOfReply(fb, staff);
        auditService.log(staff.getEmail(),
                "Replied to guest feedback " + fb.getFeedbackCode() + " for " + fb.getGuestName());

        return DtoMapper.toFeedback(fb);
    }

    private static boolean canViewAllFeedback(UserRole role) {
        return role == UserRole.ADMIN
                || role == UserRole.MANAGEMENT
                || role == UserRole.RECEPTIONIST;
    }

    private static boolean canReplyToFeedback(UserRole role) {
        return canViewAllFeedback(role);
    }

    private static FeedbackCategory parseCategory(String raw) {
        if (!StringUtils.hasText(raw)) {
            return FeedbackCategory.STAY;
        }
        String key = raw.trim().toLowerCase().replace(" ", "-");
        return switch (key) {
            case "complaint", "bad-service", "complaint-bad-service" -> FeedbackCategory.COMPLAINT;
            case "room" -> FeedbackCategory.ROOM;
            case "service" -> FeedbackCategory.SERVICE;
            case "staff" -> FeedbackCategory.STAFF;
            case "other" -> FeedbackCategory.OTHER;
            default -> FeedbackCategory.STAY;
        };
    }

    private static boolean isComplaint(GuestFeedback fb) {
        return fb.getCategory() == FeedbackCategory.COMPLAINT || fb.getRating() <= 2;
    }

    private void notifyStaff(GuestFeedback fb) {
        boolean complaint = isComplaint(fb);
        String body = fb.getGuestName() + " rated " + fb.getRating() + "/5 — "
                + DtoMapper.capitalizeFeedbackCategory(fb.getCategory())
                + (fb.getRoom() != null ? " · Room " + fb.getRoom() : "")
                + (complaint ? " · Needs follow-up" : "");
        String title = complaint
                ? "Guest complaint — " + fb.getFeedbackCode()
                : "New guest feedback — " + fb.getFeedbackCode();
        for (UserRole role : List.of(UserRole.ADMIN, UserRole.MANAGEMENT, UserRole.RECEPTIONIST)) {
            for (UserAccount staff : userAccountRepository.findByRole(role)) {
                Notification n = new Notification();
                n.setUser(staff);
                n.setTitle(title);
                n.setBody(body);
                n.setCategory(NotificationCategory.SYSTEM);
                notificationRepository.save(n);
            }
        }
    }

    private void notifyGuest(UserAccount guest, GuestFeedback fb) {
        boolean complaint = isComplaint(fb);
        Notification n = new Notification();
        n.setUser(guest);
        n.setTitle(complaint ? "Complaint received" : "Feedback received");
        n.setBody(complaint
                ? "We received your complaint " + fb.getFeedbackCode()
                        + ". Management and reception will review it and follow up with you."
                : "Thank you — your feedback " + fb.getFeedbackCode() + " was sent to hotel management.");
        n.setCategory(NotificationCategory.SYSTEM);
        notificationRepository.save(n);
    }

    private void notifyGuestOfReply(GuestFeedback fb, UserAccount staff) {
        UserAccount guest = fb.getGuestUser();
        if (guest == null) {
            return;
        }
        Notification n = new Notification();
        n.setUser(guest);
        n.setTitle("Reply to your feedback — " + fb.getFeedbackCode());
        n.setBody(staff.getName() + " replied: " + fb.getStaffReply());
        n.setCategory(NotificationCategory.SYSTEM);
        notificationRepository.save(n);
    }
}
