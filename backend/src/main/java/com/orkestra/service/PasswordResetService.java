package com.orkestra.service;

import java.time.Instant;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;
import org.springframework.stereotype.Service;

@Service
public class PasswordResetService {

    private static final long EXPIRY_SECONDS = 3600;

    private final Map<String, ResetToken> tokens = new ConcurrentHashMap<>();

    public String createToken(UUID userId, String email) {
        String token = UUID.randomUUID().toString();
        tokens.put(token, new ResetToken(userId, email, Instant.now().plusSeconds(EXPIRY_SECONDS)));
        return token;
    }

    public boolean isValid(String token) {
        ResetToken session = tokens.get(token);
        return session != null && session.expiresAt().isAfter(Instant.now());
    }

    public String emailForToken(String token) {
        ResetToken session = tokens.get(token);
        if (session == null || session.expiresAt().isBefore(Instant.now())) {
            return null;
        }
        return maskEmail(session.email());
    }

    public UUID validateAndConsume(String token) {
        ResetToken session = tokens.get(token);
        if (session == null) {
            throw new IllegalArgumentException("Reset link is invalid or has expired");
        }
        if (session.expiresAt().isBefore(Instant.now())) {
            tokens.remove(token);
            throw new IllegalArgumentException("Reset link has expired — request a new one");
        }
        tokens.remove(token);
        return session.userId();
    }

    private static String maskEmail(String email) {
        int at = email.indexOf('@');
        if (at <= 1) {
            return email;
        }
        return email.charAt(0) + "***" + email.substring(at);
    }

    private record ResetToken(UUID userId, String email, Instant expiresAt) {}
}
