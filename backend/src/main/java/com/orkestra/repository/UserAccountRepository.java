package com.orkestra.repository;

import com.orkestra.domain.entity.UserAccount;
import com.orkestra.domain.enums.UserRole;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface UserAccountRepository extends JpaRepository<UserAccount, UUID> {
    Optional<UserAccount> findByEmailIgnoreCase(String email);
    boolean existsByEmailIgnoreCase(String email);
    long countByRole(UserRole role);
    List<UserAccount> findByRole(UserRole role);
}
