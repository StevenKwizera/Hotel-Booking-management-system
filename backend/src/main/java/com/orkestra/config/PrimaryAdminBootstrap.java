package com.orkestra.config;

import com.orkestra.domain.entity.Branch;
import com.orkestra.domain.entity.UserAccount;
import com.orkestra.domain.enums.UserRole;
import com.orkestra.repository.BranchRepository;
import com.orkestra.repository.UserAccountRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.core.annotation.Order;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

/**
 * Ensures the primary administrator account exists (also works when DB was seeded earlier).
 */
@Component
@Order(100)
public class PrimaryAdminBootstrap implements CommandLineRunner {

    private static final Logger log = LoggerFactory.getLogger(PrimaryAdminBootstrap.class);

    private final UserAccountRepository userRepository;
    private final BranchRepository branchRepository;
    private final PasswordEncoder passwordEncoder;

    @Value("${orkestra.admin.email:stevegatanazi@gmail.com}")
    private String adminEmail;

    @Value("${orkestra.admin.name:Steve Gatanazi}")
    private String adminName;

    @Value("${orkestra.admin.password:Orkestra@2026}")
    private String adminPassword;

    public PrimaryAdminBootstrap(
            UserAccountRepository userRepository,
            BranchRepository branchRepository,
            PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.branchRepository = branchRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Override
    @Transactional
    public void run(String... args) {
        String email = adminEmail.trim().toLowerCase();
        Branch branch = branchRepository
                .findByCode("KIGALI")
                .orElseGet(() -> branchRepository.findAll().stream().findFirst().orElse(null));

        if (branch == null) {
            log.warn("Primary admin bootstrap skipped — no branch in database yet");
            return;
        }

        UserAccount user = userRepository.findByEmailIgnoreCase(email).orElseGet(() -> {
            UserAccount created = new UserAccount();
            created.setEmail(email);
            created.setBranch(branch);
            return created;
        });

        boolean created = user.getId() == null;
        user.setName(adminName);
        user.setEmail(email);
        user.setRole(UserRole.ADMIN);
        user.setEnabled(true);
        user.setPasswordHash(passwordEncoder.encode(adminPassword));
        user.setBranch(branch);
        userRepository.save(user);

        if (created) {
            log.info("Created primary admin: {}", email);
        } else {
            log.info("Updated primary admin credentials: {}", email);
        }
    }
}
