package com.orkestra.dto;

import com.orkestra.domain.enums.UserRole;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public final class AuthDtos {

    private AuthDtos() {}

    public record LoginRequest(
            @NotBlank @Email String email,
            @NotBlank String password) {}

    public record RegisterRequest(
            @NotBlank String name,
            @NotBlank @Email String email,
            @NotBlank @Size(min = 6) String password,
            String role) {}

    public record AuthResponse(
            String token,
            UserResponse user,
            Boolean requiresOtp,
            String otpSessionId,
            String message) {

        public static AuthResponse complete(String token, UserResponse user) {
            return new AuthResponse(token, user, false, null, null);
        }

        public static AuthResponse pendingOtp(String sessionId, boolean deliveredByEmail) {
            String message = deliveredByEmail
                    ? "A verification code was sent to your email. Enter it below to continue."
                    : "SMTP is not configured or sending failed. Check the backend server console for your 6-digit code, then enter it below.";
            return new AuthResponse(null, null, true, sessionId, message);
        }
    }

    public record OtpVerifyRequest(
            @NotBlank String otpSessionId,
            @NotBlank String code) {}

    public record ForgotPasswordRequest(
            @NotBlank @Email String email) {}

    public record ResetPasswordWithTokenRequest(
            @NotBlank String token,
            @NotBlank @Size(min = 6) String newPassword,
            @NotBlank @Size(min = 6) String confirmPassword) {}

    public record ResetTokenValidationResponse(boolean valid, String emailHint) {}

    public record UserResponse(
            String id,
            String name,
            String email,
            String role) {}

    public record CreateStaffUserRequest(
            @NotBlank String name,
            @NotBlank @Email String email,
            @NotBlank @Size(min = 6) String password,
            @NotBlank String role) {}

    public record UserListItem(
            String id,
            String name,
            String email,
            String role,
            boolean enabled,
            String branchName,
            String createdAt) {}

    public record UpdateUserRequest(Boolean enabled, String role) {}

    public record ResetPasswordRequest(String newPassword) {}
}
