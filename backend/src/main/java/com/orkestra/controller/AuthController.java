package com.orkestra.controller;

import com.orkestra.dto.ApiDtos;
import com.orkestra.dto.AuthDtos;
import com.orkestra.service.AuthService;
import com.orkestra.service.CurrentUserService;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final AuthService authService;
    private final CurrentUserService currentUser;

    public AuthController(AuthService authService, CurrentUserService currentUser) {
        this.authService = authService;
        this.currentUser = currentUser;
    }

    @PostMapping("/register")
    public AuthDtos.AuthResponse register(@Valid @RequestBody AuthDtos.RegisterRequest req) {
        return authService.register(req);
    }

    @PostMapping("/login")
    public AuthDtos.AuthResponse login(@Valid @RequestBody AuthDtos.LoginRequest req) {
        return authService.login(req);
    }

    @PostMapping("/forgot-password")
    public ApiDtos.MessageResponse forgotPassword(@Valid @RequestBody AuthDtos.ForgotPasswordRequest req) {
        return authService.forgotPassword(req);
    }

    @GetMapping("/reset-password/validate")
    public AuthDtos.ResetTokenValidationResponse validateResetToken(@RequestParam String token) {
        return authService.validateResetToken(token);
    }

    @PostMapping("/reset-password")
    public ApiDtos.MessageResponse resetPassword(@Valid @RequestBody AuthDtos.ResetPasswordWithTokenRequest req) {
        return authService.resetPasswordWithToken(req);
    }

    @GetMapping("/me")
    public AuthDtos.UserResponse me() {
        return authService.me(currentUser.requireUser());
    }
}
