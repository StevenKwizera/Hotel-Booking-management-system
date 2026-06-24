package com.orkestra.controller;

import com.orkestra.dto.ApiDtos;
import com.orkestra.dto.AuthDtos;
import com.orkestra.service.UserAdminService;
import jakarta.validation.Valid;
import java.util.List;
import java.util.UUID;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/users")
public class UserController {

    private final UserAdminService userAdminService;

    public UserController(UserAdminService userAdminService) {
        this.userAdminService = userAdminService;
    }

    @GetMapping
    public List<AuthDtos.UserListItem> list() {
        return userAdminService.listUsers();
    }

    @PostMapping
    public AuthDtos.UserResponse createStaff(@Valid @RequestBody AuthDtos.CreateStaffUserRequest req) {
        return userAdminService.createStaffUser(req);
    }

    @PatchMapping("/{id}")
    public AuthDtos.UserListItem update(
            @PathVariable UUID id,
            @RequestBody AuthDtos.UpdateUserRequest req) {
        return userAdminService.updateUser(id, req);
    }

    @PostMapping("/{id}/reset-password")
    public ApiDtos.MessageResponse resetPassword(
            @PathVariable UUID id,
            @RequestBody(required = false) AuthDtos.ResetPasswordRequest req) {
        return userAdminService.resetPassword(id, req);
    }

    @DeleteMapping("/{id}")
    public ApiDtos.MessageResponse delete(@PathVariable UUID id) {
        return userAdminService.deleteUser(id);
    }
}
