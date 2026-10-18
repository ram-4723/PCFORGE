package com.pcforge.services;

import com.pcforge.dto.AuthResult;
import com.pcforge.dto.LoginRequest;
import com.pcforge.dto.PublicUser;
import com.pcforge.dto.RegisterRequest;
import com.pcforge.exception.ApiException;
import com.pcforge.models.AuthSession;
import com.pcforge.models.UserAccount;
import com.pcforge.repositories.AuthSessionRepository;
import com.pcforge.repositories.UserAccountRepository;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.SecureRandom;
import java.time.Duration;
import java.time.Instant;
import java.util.Base64;
import org.springframework.dao.DuplicateKeyException;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

@Service
public class AuthService {
    private static final Duration SESSION_LIFETIME = Duration.ofHours(12);
    private static final SecureRandom RANDOM = new SecureRandom();
    private final UserAccountRepository users;
    private final AuthSessionRepository sessions;
    private final PasswordEncoder passwordEncoder;

    public AuthService(UserAccountRepository users, AuthSessionRepository sessions, PasswordEncoder passwordEncoder) {
        this.users = users;
        this.sessions = sessions;
        this.passwordEncoder = passwordEncoder;
    }

    public AuthResult register(RegisterRequest request) {
        String email = normalizeEmail(request.email());
        if (users.findByEmail(email).isPresent()) throw new ApiException(HttpStatus.CONFLICT, "EMAIL_ALREADY_REGISTERED", "An account with this email already exists.");
        if (request.password().getBytes(StandardCharsets.UTF_8).length > 72) throw new ApiException(HttpStatus.BAD_REQUEST, "INVALID_PASSWORD", "Password must be no more than 72 UTF-8 bytes.");
        UserAccount account = new UserAccount();
        account.setName(request.name().trim());
        account.setEmail(email);
        account.setPasswordHash(passwordEncoder.encode(request.password()));
        account.setRole("USER");
        account.setRegisteredAt(Instant.now());
        try { account = users.save(account); }
        catch (DuplicateKeyException duplicate) { throw new ApiException(HttpStatus.CONFLICT, "EMAIL_ALREADY_REGISTERED", "An account with this email already exists."); }
        return issueSession(account);
    }

    public AuthResult login(LoginRequest request) {
        UserAccount account = users.findByEmail(normalizeEmail(request.email())).orElse(null);
        if (account == null || !passwordEncoder.matches(request.password(), account.getPasswordHash())) {
            throw new ApiException(HttpStatus.UNAUTHORIZED, "INVALID_CREDENTIALS", "Email or password is incorrect.");
        }
        return issueSession(account);
    }

    public UserAccount requireUser(String authorization) {
        if (!StringUtils.hasText(authorization) || !authorization.startsWith("Bearer ") || authorization.length() > 256) {
            throw new ApiException(HttpStatus.UNAUTHORIZED, "AUTHENTICATION_REQUIRED", "Sign in to continue.");
        }
        String token = authorization.substring(7).trim();
        if (token.length() < 40 || token.length() > 200) throw new ApiException(HttpStatus.UNAUTHORIZED, "INVALID_SESSION", "Your session is invalid or expired. Sign in again.");
        String tokenHash = sha256(token);
        AuthSession session = sessions.findByTokenHash(tokenHash)
                .filter(value -> value.getExpiresAt() != null && value.getExpiresAt().isAfter(Instant.now()))
                .orElseThrow(() -> new ApiException(HttpStatus.UNAUTHORIZED, "INVALID_SESSION", "Your session is invalid or expired. Sign in again."));
        return users.findById(session.getUserId())
                .orElseThrow(() -> new ApiException(HttpStatus.UNAUTHORIZED, "INVALID_SESSION", "Your account is no longer available."));
    }

    public UserAccount requireAdmin(String authorization) {
        UserAccount account = requireUser(authorization);
        if (!"ADMIN".equals(account.getRole())) throw new ApiException(HttpStatus.FORBIDDEN, "ADMIN_REQUIRED", "Administrator access is required.");
        return account;
    }

    public void logout(String authorization) {
        if (!StringUtils.hasText(authorization) || !authorization.startsWith("Bearer ")) return;
        sessions.deleteByTokenHash(sha256(authorization.substring(7).trim()));
    }

    private AuthResult issueSession(UserAccount account) {
        byte[] bytes = new byte[48];
        RANDOM.nextBytes(bytes);
        String token = Base64.getUrlEncoder().withoutPadding().encodeToString(bytes);
        Instant expiresAt = Instant.now().plus(SESSION_LIFETIME);
        AuthSession session = new AuthSession();
        session.setTokenHash(sha256(token));
        session.setUserId(account.getId());
        session.setExpiresAt(expiresAt);
        sessions.save(session);
        return new AuthResult(token, expiresAt, PublicUser.from(account));
    }

    private static String normalizeEmail(String email) { return email.trim().toLowerCase(java.util.Locale.ROOT); }

    private static String sha256(String value) {
        try {
            byte[] digest = MessageDigest.getInstance("SHA-256").digest(value.getBytes(StandardCharsets.UTF_8));
            return java.util.HexFormat.of().formatHex(digest);
        } catch (java.security.NoSuchAlgorithmException impossible) { throw new IllegalStateException(impossible); }
    }
}
