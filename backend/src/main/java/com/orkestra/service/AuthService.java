package com.orkestra.service;

import com.orkestra.domain.entity.GuestProfile;
import com.orkestra.domain.entity.UserAccount;
import com.orkestra.domain.enums.GuestTier;
import com.orkestra.domain.enums.UserRole;
import com.orkestra.dto.AuthDtos;
import com.orkestra.dto.ApiDtos;
import com.orkestra.repository.GuestProfileRepository;
import com.orkestra.repository.UserAccountRepository;
import com.orkestra.security.JwtService;
import java.util.UUID;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class AuthService {

    private final UserAccountRepository userRepository;
    private final GuestProfileRepository guestProfileRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final PasswordResetService passwordResetService;
    private final EmailService emailService;
    private final AuditService auditService;

    @Value("${orkestra.frontend-url:http://localhost:5173}")
    private String frontendUrl;

    public AuthService(
            UserAccountRepository userRepository,
            GuestProfileRepository guestProfileRepository,
            PasswordEncoder passwordEncoder,
            JwtService jwtService,
            PasswordResetService passwordResetService,
            EmailService emailService,
            AuditService auditService) {
        this.userRepository = userRepository;
        this.guestProfileRepository = guestProfileRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtService = jwtService;
        this.passwordResetService = passwordResetService;
        this.emailService = emailService;
        this.auditService = auditService;
    }

    @Transactional
    public AuthDtos.AuthResponse register(AuthDtos.RegisterRequest req) {
        String email = req.email().trim().toLowerCase();
        if (userRepository.existsByEmailIgnoreCase(email)) {
            throw new IllegalArgumentException("An account with this email already exists");
        }
        UserAccount user = new UserAccount();
        user.setName(req.name().trim());
        user.setEmail(email);
        user.setPasswordHash(passwordEncoder.encode(req.password()));
        user.setRole(UserRole.GUEST);
        user = userRepository.save(user);

        GuestProfile profile = new GuestProfile();
        profile.setUser(user);
        profile.setTier(GuestTier.STANDARD);
        guestProfileRepository.save(profile);
        user.setGuestProfile(profile);

        auditService.log(email, "Guest self-registered via public signup");
        return buildAuthResponse(user);
    }

    public AuthDtos.AuthResponse login(AuthDtos.LoginRequest req) {
        UserAccount user = validateCredentials(req.email(), req.password());
        auditService.log(user.getEmail(), "User logged in");
        return buildAuthResponse(user);
    }

    public ApiDtos.MessageResponse forgotPassword(AuthDtos.ForgotPasswordRequest req) {
        String email = req.email().trim().toLowerCase();
        UserAccount user = userRepository.findByEmailIgnoreCase(email)
                .orElseThrow(() -> new IllegalArgumentException("Account not found"));

        String token = passwordResetService.createToken(user.getId(), user.getEmail());
        String resetLink = frontendUrl.replaceAll("/$", "") + "/reset-password?token=" + token;
        emailService.sendPasswordResetLink(user.getEmail(), user.getName(), resetLink);

        auditService.log(user.getEmail(), "Password reset link requested");
        String message = emailService.isSmtpConfigured()
                ? "A password reset link was sent to your email. Check your inbox and click the link."
                : "SMTP is not configured — check the backend console for the reset link, then open it in your browser.";
        return new ApiDtos.MessageResponse(message);
    }

    public AuthDtos.ResetTokenValidationResponse validateResetToken(String token) {
        if (token == null || token.isBlank()) {
            return new AuthDtos.ResetTokenValidationResponse(false, null);
        }
        String masked = passwordResetService.emailForToken(token.trim());
        return new AuthDtos.ResetTokenValidationResponse(masked != null, masked);
    }

    @Transactional
    public ApiDtos.MessageResponse resetPasswordWithToken(AuthDtos.ResetPasswordWithTokenRequest req) {
        if (!req.newPassword().equals(req.confirmPassword())) {
            throw new IllegalArgumentException("Passwords do not match");
        }
        UUID userId = passwordResetService.validateAndConsume(req.token().trim());
        UserAccount user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));
        user.setPasswordHash(passwordEncoder.encode(req.newPassword()));
        userRepository.save(user);
        auditService.log(user.getEmail(), "Password reset completed via email link");
        return new ApiDtos.MessageResponse("Password updated successfully. You can sign in with your new password.");
    }

    public AuthDtos.UserResponse me(UserAccount user) {
        return toUserResponse(user);
    }

    private UserAccount validateCredentials(String email, String password) {
        UserAccount user = userRepository.findByEmailIgnoreCase(email.trim())
                .orElseThrow(() -> new IllegalArgumentException("Invalid email or password"));
        if (!passwordEncoder.matches(password, user.getPasswordHash())) {
            auditService.log(email, "Failed login attempt");
            throw new IllegalArgumentException("Invalid email or password");
        }
        return user;
    }

    private AuthDtos.AuthResponse buildAuthResponse(UserAccount user) {
        String token = jwtService.generateToken(
                user.getId(), user.getEmail(), user.getRole().name());
        return AuthDtos.AuthResponse.complete(token, toUserResponse(user));
    }

    private AuthDtos.UserResponse toUserResponse(UserAccount user) {
        return new AuthDtos.UserResponse(
                user.getId().toString(),
                user.getName(),
                user.getEmail(),
                user.getRole().name().toLowerCase());
    }
}
