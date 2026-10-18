package com.pcforge.config;

import com.pcforge.models.UserAccount;
import com.pcforge.repositories.UserAccountRepository;
import java.nio.charset.StandardCharsets;
import java.time.Instant;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;

@Component
public class InitialAdminBootstrap implements ApplicationRunner {
    private static final Logger log = LoggerFactory.getLogger(InitialAdminBootstrap.class);
    private final UserAccountRepository users;
    private final PasswordEncoder passwords;
    private final String email;
    private final String name;
    private final String password;

    public InitialAdminBootstrap(UserAccountRepository users, PasswordEncoder passwords,
            @Value("${PCFORGE_ADMIN_BOOTSTRAP_EMAIL:}") String email,
            @Value("${PCFORGE_ADMIN_BOOTSTRAP_NAME:}") String name,
            @Value("${PCFORGE_ADMIN_BOOTSTRAP_PASSWORD:}") String password) {
        this.users = users; this.passwords = passwords; this.email = email; this.name = name; this.password = password;
    }

    @Override
    public void run(ApplicationArguments args) {
        boolean anyConfigured = StringUtils.hasText(email) || StringUtils.hasText(name) || StringUtils.hasText(password);
        if (!anyConfigured) return;
        if (!StringUtils.hasText(email) || !StringUtils.hasText(name) || !StringUtils.hasText(password)) {
            throw new IllegalStateException("Set all PCFORGE_ADMIN_BOOTSTRAP_EMAIL, PCFORGE_ADMIN_BOOTSTRAP_NAME, and PCFORGE_ADMIN_BOOTSTRAP_PASSWORD values together.");
        }
        if (password.length() < 10 || password.getBytes(StandardCharsets.UTF_8).length > 72) {
            throw new IllegalStateException("The bootstrap admin password must be at least 10 characters and no more than 72 UTF-8 bytes.");
        }
        if (users.existsByRole("ADMIN")) {
            log.info("An administrator already exists; initial admin bootstrap was skipped.");
            return;
        }
        UserAccount admin = new UserAccount();
        admin.setName(name.trim()); admin.setEmail(email.trim().toLowerCase(java.util.Locale.ROOT));
        admin.setPasswordHash(passwords.encode(password)); admin.setRole("ADMIN"); admin.setRegisteredAt(Instant.now());
        users.save(admin);
        log.info("Initial PCForge administrator created from bootstrap environment configuration.");
    }
}
