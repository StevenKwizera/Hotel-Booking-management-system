package com.orkestra.controller;

import com.orkestra.dto.ApiDtos;
import com.orkestra.service.NotificationService;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/notifications")
public class NotificationController {

    private final NotificationService notificationService;

    public NotificationController(NotificationService notificationService) {
        this.notificationService = notificationService;
    }

    @GetMapping
    public List<ApiDtos.NotificationDto> list() {
        return notificationService.list();
    }

    @GetMapping("/unread-count")
    public Map<String, Long> unreadCount() {
        return Map.of("count", notificationService.unreadCount());
    }

    @GetMapping("/recipients")
    public List<ApiDtos.MessageRecipientDto> recipients() {
        return notificationService.listRecipients();
    }

    @PatchMapping("/{id}/read")
    public ApiDtos.MessageResponse markRead(@PathVariable UUID id) {
        notificationService.markRead(id);
        return new ApiDtos.MessageResponse("Marked as read");
    }

    @PostMapping("/read-all")
    public ApiDtos.MessageResponse markAllRead() {
        notificationService.markAllRead();
        return new ApiDtos.MessageResponse("All marked as read");
    }

    @DeleteMapping("/{id}")
    public ApiDtos.MessageResponse dismiss(@PathVariable UUID id) {
        notificationService.dismiss(id);
        return new ApiDtos.MessageResponse("Dismissed");
    }

    @PostMapping("/send")
    public ApiDtos.NotificationDto send(@RequestBody ApiDtos.SendNotificationRequest req) {
        return notificationService.send(req);
    }
}
