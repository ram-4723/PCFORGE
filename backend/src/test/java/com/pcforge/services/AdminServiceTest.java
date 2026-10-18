package com.pcforge.services;

import com.pcforge.exception.ApiException;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpStatus;
import org.springframework.data.mongodb.core.MongoTemplate;
import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

class AdminServiceTest {
    private final AuthService auth = mock(AuthService.class);
    private final MongoTemplate mongo = mock(MongoTemplate.class);
    private final AdminService admin = new AdminService(auth, mongo);

    @Test void unauthenticatedRequestsAreRejectedBeforeAnyUserQuery() {
        when(auth.requireAdmin(null)).thenThrow(new ApiException(HttpStatus.UNAUTHORIZED, "AUTHENTICATION_REQUIRED", "Sign in to continue."));
        ApiException error = assertThrows(ApiException.class, () -> admin.users(null, 1, 10, null));
        assertEquals(HttpStatus.UNAUTHORIZED, error.getStatus());
        verifyNoInteractions(mongo);
    }
}
