package com.pcforge.services;

import com.pcforge.dto.LoginRequest;
import com.pcforge.dto.RegisterRequest;
import com.pcforge.exception.ApiException;
import com.pcforge.models.AuthSession;
import com.pcforge.models.UserAccount;
import com.pcforge.repositories.AuthSessionRepository;
import com.pcforge.repositories.UserAccountRepository;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

class AuthServiceTest {
    private final UserAccountRepository users = mock(UserAccountRepository.class);
    private final AuthSessionRepository sessions = mock(AuthSessionRepository.class);
    private final BCryptPasswordEncoder encoder = new BCryptPasswordEncoder(4);
    private final AuthService service = new AuthService(users, sessions, encoder);

    @Test void registrationNormalizesEmailAndStoresOnlyBcryptPasswordHash() {
        when(users.findByEmail("user@example.com")).thenReturn(java.util.Optional.empty());
        when(users.save(any(UserAccount.class))).thenAnswer(invocation -> {
            UserAccount saved = invocation.getArgument(0);
            saved.setId("user-1");
            return saved;
        });
        when(sessions.save(any(AuthSession.class))).thenAnswer(invocation -> invocation.getArgument(0));

        var result = service.register(new RegisterRequest("  Sample User  ", " USER@EXAMPLE.COM ", "correct horse battery"));

        var account = org.mockito.ArgumentCaptor.forClass(UserAccount.class);
        verify(users).save(account.capture());
        assertEquals("Sample User", account.getValue().getName());
        assertEquals("user@example.com", account.getValue().getEmail());
        assertEquals("USER", account.getValue().getRole());
        assertNotEquals("correct horse battery", account.getValue().getPasswordHash());
        assertTrue(encoder.matches("correct horse battery", account.getValue().getPasswordHash()));
        assertEquals("user@example.com", result.user().email());
        assertEquals("USER", result.user().role());
        assertFalse(result.accessToken().isBlank());
    }

    @Test void duplicateEmailIsRejectedBeforeAnotherAccountIsSaved() {
        UserAccount existing = new UserAccount();
        existing.setEmail("user@example.com");
        when(users.findByEmail("user@example.com")).thenReturn(java.util.Optional.of(existing));
        ApiException error = assertThrows(ApiException.class, () -> service.register(new RegisterRequest("Another User", "USER@example.com", "correct horse battery")));
        assertEquals(HttpStatus.CONFLICT, error.getStatus());
        assertEquals("EMAIL_ALREADY_REGISTERED", error.getCode());
        verify(users, never()).save(any());
    }

    @Test void loginUsesSameGenericErrorForUnknownEmailAndWrongPassword() {
        when(users.findByEmail("missing@example.com")).thenReturn(java.util.Optional.empty());
        ApiException error = assertThrows(ApiException.class, () -> service.login(new LoginRequest("missing@example.com", "wrong password")));
        assertEquals(HttpStatus.UNAUTHORIZED, error.getStatus());
        assertEquals("INVALID_CREDENTIALS", error.getCode());
    }

    @Test void regularUserCannotUseAdminAuthorization() {
        when(users.findByEmail("user@example.com")).thenReturn(java.util.Optional.empty());
        when(users.save(any(UserAccount.class))).thenAnswer(invocation -> {
            UserAccount saved = invocation.getArgument(0);
            saved.setId("user-1");
            return saved;
        });
        when(sessions.save(any(AuthSession.class))).thenAnswer(invocation -> invocation.getArgument(0));
        var login = service.register(new RegisterRequest("Sample User", "user@example.com", "correct horse battery"));
        var sessionCaptor = org.mockito.ArgumentCaptor.forClass(AuthSession.class);
        verify(sessions).save(sessionCaptor.capture());
        assertNotEquals(login.accessToken(), sessionCaptor.getValue().getTokenHash());
        when(sessions.findByTokenHash(anyString())).thenReturn(java.util.Optional.of(sessionCaptor.getValue()));
        var accountCaptor = org.mockito.ArgumentCaptor.forClass(UserAccount.class);
        verify(users).save(accountCaptor.capture());
        when(users.findById("user-1")).thenReturn(java.util.Optional.of(accountCaptor.getValue()));
        ApiException error = assertThrows(ApiException.class, () -> service.requireAdmin("Bearer " + login.accessToken()));
        assertEquals(HttpStatus.FORBIDDEN, error.getStatus());
        assertEquals("ADMIN_REQUIRED", error.getCode());
    }
}
