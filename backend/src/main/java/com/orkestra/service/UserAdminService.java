package com.orkestra.service;

import com.orkestra.domain.entity.Branch;
import com.orkestra.domain.entity.UserAccount;
import com.orkestra.domain.enums.UserRole;
import com.orkestra.dto.ApiDtos;
import com.orkestra.dto.AuthDtos;
import com.orkestra.repository.BranchRepository;
import com.orkestra.repository.UserAccountRepository;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.util.Comparator;
import java.util.List;
import java.util.Set;
import java.util.UUID;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class UserAdminService {

    private static final Set<UserRole> MANAGEMENT_CAN_CREATE = Set.of(
            UserRole.RECEPTIONIST, UserRole.STAFF, UserRole.FINANCE);

    private static final Set<UserRole> ADMIN_CAN_CREATE = Set.of(
            UserRole.ADMIN,
            UserRole.MANAGEMENT,
            UserRole.RECEPTIONIST,
            UserRole.STAFF,
            UserRole.FINANCE);

    private final UserAccountRepository userRepository;
    private final BranchRepository branchRepository;
    private final PasswordEncoder passwordEncoder;
    private final CurrentUserService currentUser;
    private final AuditService auditService;

    public UserAdminService(
            UserAccountRepository userRepository,
            BranchRepository branchRepository,
            PasswordEncoder passwordEncoder,
            CurrentUserService currentUser,
            AuditService auditService) {
        this.userRepository = userRepository;
        this.branchRepository = branchRepository;
        this.passwordEncoder = passwordEncoder;
        this.currentUser = currentUser;
        this.auditService = auditService;
    }

    private static final DateTimeFormatter USER_DATE_FMT =
            DateTimeFormatter.ofPattern("yyyy-MM-dd")
                    .withZone(ZoneId.of("Africa/Kigali"));

    @Transactional(readOnly = true)
    public List<AuthDtos.UserListItem> listUsers() {
        UserAccount actor = currentUser.requireUser();
        if (actor.getRole() != UserRole.ADMIN && actor.getRole() != UserRole.MANAGEMENT) {
            throw new IllegalArgumentException("Only Admin or Management can view user directory");
        }
        return userRepository.findAll().stream()
                .sorted(Comparator.comparing(UserAccount::getName, String.CASE_INSENSITIVE_ORDER))
                .map(u -> new AuthDtos.UserListItem(
                        u.getId().toString(),
                        u.getName(),
                        u.getEmail(),
                        u.getRole().name().toLowerCase(),
                        u.isEnabled(),
                        u.getBranch() != null ? u.getBranch().getName() : "—",
                        USER_DATE_FMT.format(u.getCreatedAt())))
                .toList();
    }

    @Transactional
    public AuthDtos.UserResponse createStaffUser(AuthDtos.CreateStaffUserRequest req) {
        UserAccount actor = currentUser.requireUser();
        UserRole targetRole = UserRole.valueOf(req.role().trim().toUpperCase());

        if (targetRole == UserRole.GUEST) {
            throw new IllegalArgumentException("Guests must self-register. Use public signup.");
        }

        if (actor.getRole() == UserRole.ADMIN) {
            if (!ADMIN_CAN_CREATE.contains(targetRole)) {
                throw new IllegalArgumentException("Invalid role for staff creation");
            }
        } else if (actor.getRole() == UserRole.MANAGEMENT) {
            if (!MANAGEMENT_CAN_CREATE.contains(targetRole)) {
                throw new IllegalArgumentException("Managers can only create Receptionist, Staff, and Finance accounts");
            }
        } else {
            throw new IllegalArgumentException("Only Admin or Management can create staff accounts");
        }

        String email = req.email().trim().toLowerCase();
        if (userRepository.existsByEmailIgnoreCase(email)) {
            throw new IllegalArgumentException("An account with this email already exists");
        }

        Branch branch = branchRepository.findByCode("KIGALI")
                .orElseThrow(() -> new IllegalArgumentException("Default branch not found"));

        UserAccount user = new UserAccount();
        user.setName(req.name().trim());
        user.setEmail(email);
        user.setPasswordHash(passwordEncoder.encode(req.password()));
        user.setRole(targetRole);
        user.setBranch(branch);
        user = userRepository.save(user);

        auditService.log(
                actor.getEmail(),
                "Created staff account " + email + " with role " + targetRole);

        return new AuthDtos.UserResponse(
                user.getId().toString(),
                user.getName(),
                user.getEmail(),
                user.getRole().name().toLowerCase());
    }

    @Transactional
    public AuthDtos.UserListItem updateUser(UUID id, AuthDtos.UpdateUserRequest req) {
        UserAccount actor = currentUser.requireUser();
        if (actor.getRole() != UserRole.ADMIN) {
            throw new IllegalArgumentException("Only administrators can update user accounts");
        }
        UserAccount target = userRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));
        if (req.enabled() != null) {
            target.setEnabled(req.enabled());
        }
        if (req.role() != null && !req.role().isBlank()) {
            UserRole newRole = UserRole.valueOf(req.role().trim().toUpperCase());
            if (newRole == UserRole.GUEST && target.getRole() != UserRole.GUEST) {
                throw new IllegalArgumentException("Cannot assign guest role via admin update — use registration");
            }
            target.setRole(newRole);
        }
        target = userRepository.save(target);
        auditService.log(actor.getEmail(), "Updated user " + target.getEmail());
        return new AuthDtos.UserListItem(
                target.getId().toString(),
                target.getName(),
                target.getEmail(),
                target.getRole().name().toLowerCase(),
                target.isEnabled(),
                target.getBranch() != null ? target.getBranch().getName() : "—",
                USER_DATE_FMT.format(target.getCreatedAt()));
    }

    @Transactional
    public ApiDtos.MessageResponse resetPassword(UUID id, AuthDtos.ResetPasswordRequest req) {
        UserAccount actor = currentUser.requireUser();
        if (actor.getRole() != UserRole.ADMIN) {
            throw new IllegalArgumentException("Only administrators can reset passwords");
        }
        UserAccount target = userRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));
        String newPassword = (req != null && req.newPassword() != null && !req.newPassword().isBlank())
                ? req.newPassword().trim()
                : "password123";
        if (newPassword.length() < 6) {
            throw new IllegalArgumentException("Password must be at least 6 characters");
        }
        target.setPasswordHash(passwordEncoder.encode(newPassword));
        userRepository.save(target);
        auditService.log(actor.getEmail(), "Reset password for " + target.getEmail());
        return new ApiDtos.MessageResponse("Password reset for " + target.getEmail());
    }

    @Transactional
    public ApiDtos.MessageResponse deleteUser(UUID id) {
        UserAccount actor = currentUser.requireUser();
        if (actor.getRole() != UserRole.ADMIN) {
            throw new IllegalArgumentException("Only administrators can delete users");
        }
        if (actor.getId().equals(id)) {
            throw new IllegalArgumentException("You cannot delete your own account");
        }
        UserAccount target = userRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));
        String email = target.getEmail();
        try {
            userRepository.delete(target);
        } catch (DataIntegrityViolationException ex) {
            throw new IllegalArgumentException("Cannot delete this user due to related records (bookings/payments)");
        }
        auditService.log(actor.getEmail(), "Deleted user " + email);
        return new ApiDtos.MessageResponse("User deleted: " + email);
    }
}
