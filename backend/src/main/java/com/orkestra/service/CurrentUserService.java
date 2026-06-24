package com.orkestra.service;

import com.orkestra.domain.entity.UserAccount;
import com.orkestra.domain.enums.UserRole;
import com.orkestra.repository.UserAccountRepository;
import com.orkestra.security.UserPrincipal;
import java.util.Optional;
import java.util.UUID;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;

@Service
public class CurrentUserService {

    private final UserAccountRepository userRepository;

    public CurrentUserService(UserAccountRepository userRepository) {
        this.userRepository = userRepository;
    }

    public UserAccount requireUser() {
        UserPrincipal principal = (UserPrincipal) SecurityContextHolder.getContext()
                .getAuthentication()
                .getPrincipal();
        return userRepository.findById(principal.getId())
                .orElseThrow(() -> new IllegalArgumentException("User not found"));
    }

    public UUID requireUserId() {
        return requireUser().getId();
    }

    public boolean hasRole(UserRole... roles) {
        UserRole current = requireUser().getRole();
        for (UserRole r : roles) {
            if (current == r) return true;
        }
        return false;
    }

    public boolean isGuest() {
        return requireUser().getRole() == UserRole.GUEST;
    }

    public Optional<UserAccount> findUserByEmail(String email) {
        return userRepository.findByEmailIgnoreCase(email.trim().toLowerCase());
    }
}
