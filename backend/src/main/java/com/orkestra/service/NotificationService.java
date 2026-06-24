package com.orkestra.service;

import com.orkestra.domain.entity.Notification;
import com.orkestra.domain.entity.UserAccount;
import com.orkestra.domain.enums.NotificationCategory;
import com.orkestra.domain.enums.UserRole;
import com.orkestra.dto.ApiDtos;
import com.orkestra.repository.NotificationRepository;
import com.orkestra.repository.UserAccountRepository;
import java.util.Comparator;
import java.util.List;
import java.util.UUID;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class NotificationService {

    private final NotificationRepository notificationRepository;
    private final UserAccountRepository userRepository;
    private final CurrentUserService currentUser;
    private final AuditService auditService;

    public NotificationService(
            NotificationRepository notificationRepository,
            UserAccountRepository userRepository,
            CurrentUserService currentUser,
            AuditService auditService) {
        this.notificationRepository = notificationRepository;
        this.userRepository = userRepository;
        this.currentUser = currentUser;
        this.auditService = auditService;
    }

    public List<ApiDtos.NotificationDto> list() {
        UUID userId = currentUser.requireUserId();
        return notificationRepository.findByUserIdOrderByCreatedAtDesc(userId).stream()
                .map(DtoMapper::toNotif)
                .toList();
    }

    public long unreadCount() {
        return notificationRepository.countByUserIdAndReadFalse(currentUser.requireUserId());
    }

    public List<ApiDtos.MessageRecipientDto> listRecipients() {
        UserAccount actor = currentUser.requireUser();
        return userRepository.findAll().stream()
                .filter(UserAccount::isEnabled)
                .filter(u -> !u.getId().equals(actor.getId()))
                .filter(u -> canMessage(actor.getRole(), u.getRole()))
                .sorted(Comparator.comparing(UserAccount::getName, String.CASE_INSENSITIVE_ORDER))
                .map(u -> new ApiDtos.MessageRecipientDto(
                        u.getId().toString(),
                        u.getName(),
                        u.getEmail(),
                        u.getRole().name().toLowerCase()))
                .toList();
    }

    @Transactional
    public void markRead(UUID id) {
        Notification n = notificationRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Notification not found"));
        n.setRead(true);
        notificationRepository.save(n);
    }

    @Transactional
    public void markAllRead() {
        UUID userId = currentUser.requireUserId();
        notificationRepository.findByUserIdOrderByCreatedAtDesc(userId).forEach(n -> {
            n.setRead(true);
            notificationRepository.save(n);
        });
    }

    @Transactional
    public void dismiss(UUID id) {
        notificationRepository.deleteById(id);
    }

    @Transactional
    public ApiDtos.NotificationDto send(ApiDtos.SendNotificationRequest req) {
        UserAccount sender = currentUser.requireUser();
        if (req.toEmail() == null || req.toEmail().isBlank()) {
            throw new IllegalArgumentException("Recipient email is required");
        }
        UserAccount recipient = userRepository.findByEmailIgnoreCase(req.toEmail().trim().toLowerCase())
                .orElseThrow(() -> new IllegalArgumentException("Recipient not found"));
        if (!recipient.isEnabled()) {
            throw new IllegalArgumentException("Recipient account is disabled");
        }
        if (!canMessage(sender.getRole(), recipient.getRole())) {
            throw new IllegalArgumentException("You cannot send messages to this user");
        }
        if (recipient.getId().equals(sender.getId())) {
            throw new IllegalArgumentException("You cannot message yourself");
        }
        Notification notification = new Notification();
        notification.setUser(recipient);
        notification.setTitle((req.title() == null || req.title().isBlank()) ? "New message" : req.title().trim());
        notification.setBody(req.body() == null ? "" : req.body().trim());
        notification.setCategory(parseCategory(req.category()));
        notification.setRead(false);
        notification = notificationRepository.save(notification);
        auditService.log(sender.getEmail(), "Sent message to " + recipient.getEmail());
        return DtoMapper.toNotif(notification);
    }

    private NotificationCategory parseCategory(String category) {
        if (category == null || category.isBlank()) return NotificationCategory.SYSTEM;
        try {
            return NotificationCategory.valueOf(category.trim().toUpperCase().replace("-", "_"));
        } catch (IllegalArgumentException ignored) {
            return NotificationCategory.SYSTEM;
        }
    }

    private boolean canMessage(UserRole sender, UserRole recipient) {
        if (sender == UserRole.GUEST) {
            return recipient == UserRole.RECEPTIONIST
                    || recipient == UserRole.ADMIN
                    || recipient == UserRole.MANAGEMENT
                    || recipient == UserRole.STAFF;
        }
        if (sender == UserRole.RECEPTIONIST
                || sender == UserRole.STAFF
                || sender == UserRole.FINANCE) {
            return recipient == UserRole.GUEST
                    || recipient == UserRole.RECEPTIONIST
                    || recipient == UserRole.STAFF
                    || recipient == UserRole.FINANCE
                    || recipient == UserRole.ADMIN
                    || recipient == UserRole.MANAGEMENT;
        }
        if (sender == UserRole.ADMIN || sender == UserRole.MANAGEMENT) {
            return true;
        }
        return false;
    }
}
