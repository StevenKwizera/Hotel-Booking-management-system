package com.orkestra.service;

import com.orkestra.domain.enums.UserRole;
import com.orkestra.repository.SystemConfigRepository;
import java.security.SecureRandom;
import java.time.Instant;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;
import org.springframework.stereotype.Service;

@Service
public class OtpService {

    private static final SecureRandom RANDOM = new SecureRandom();

    private final Map<String, OtpSession> sessions = new ConcurrentHashMap<>();
    private final EmailService emailService;
    private final SystemConfigRepository systemConfigRepository;

    public OtpService(EmailService emailService, SystemConfigRepository systemConfigRepository) {
        this.emailService = emailService;
        this.systemConfigRepository = systemConfigRepository;
    }

    public boolean requiresOtp(UserRole role) {
        return false;
    }

    public String createSession(UUID userId, String email) {
        return createSession(userId, email, OtpPurpose.LOGIN);
    }

    public String createPasswordResetSession(UUID userId, String email) {
        return createSession(userId, email, OtpPurpose.PASSWORD_RESET);
    }

    private String createSession(UUID userId, String email, OtpPurpose purpose) {
        String code = generateCode();
        String id = UUID.randomUUID().toString();
        sessions.put(id, new OtpSession(userId, email, code, Instant.now().plusSeconds(600), purpose));
        if (purpose == OtpPurpose.LOGIN) {
            emailService.sendLoginOtp(email, code);
        } else {
            emailService.sendPasswordResetOtp(email, code);
        }
        return id;
    }

    public UUID verifyAndConsume(String sessionId, String code) {
        return verifyAndConsume(sessionId, code, OtpPurpose.LOGIN);
    }

    public UUID verifyPasswordResetAndConsume(String sessionId, String code) {
        return verifyAndConsume(sessionId, code, OtpPurpose.PASSWORD_RESET);
    }

    private UUID verifyAndConsume(String sessionId, String code, OtpPurpose expectedPurpose) {
        OtpSession session = sessions.get(sessionId);
        if (session == null) {
            throw new IllegalArgumentException("OTP session expired or invalid");
        }
        if (session.expiresAt().isBefore(Instant.now())) {
            sessions.remove(sessionId);
            throw new IllegalArgumentException("OTP session expired");
        }
        if (session.purpose() != expectedPurpose) {
            throw new IllegalArgumentException("OTP session type mismatch");
        }
        if (!session.code().equals(code.trim())) {
            throw new IllegalArgumentException("Invalid OTP code");
        }
        sessions.remove(sessionId);
        return session.userId();
    }

    private static String generateCode() {
        return String.format("%06d", RANDOM.nextInt(1_000_000));
    }

    private enum OtpPurpose {
        LOGIN,
        PASSWORD_RESET
    }

    private record OtpSession(
            UUID userId, String email, String code, Instant expiresAt, OtpPurpose purpose) {}
}
