package com.orkestra.controller;

import com.orkestra.service.EmailService;
import java.util.Map;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class HealthController {

    private final EmailService emailService;

    public HealthController(EmailService emailService) {
        this.emailService = emailService;
    }

    @GetMapping("/api/health")
    public Map<String, String> health() {
        return Map.of("status", "UP", "service", "orkestra-api");
    }

    @GetMapping("/api/health/email")
    public Map<String, Object> emailStatus() {
        return emailService.mailStatus();
    }

    /** Send a test email (e.g. GET /api/health/test-email?to=you@gmail.com) to verify Gmail. */
    @PostMapping("/api/health/test-email")
    public Map<String, String> testEmail(@RequestParam String to) {
        emailService.sendTestEmail(to);
        return Map.of(
                "status", "sent",
                "to", to.trim().toLowerCase(),
                "message", "Check inbox and Spam/Promotions folder");
    }
}
