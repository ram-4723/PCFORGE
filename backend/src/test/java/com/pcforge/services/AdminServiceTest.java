package com.pcforge.services;

import com.pcforge.exception.ApiException;
import com.pcforge.models.Order;
import com.pcforge.repositories.OrderRepository;
import java.util.Optional;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpStatus;
import org.springframework.data.mongodb.core.MongoTemplate;
import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

class AdminServiceTest {
    private final AuthService auth = mock(AuthService.class);
    private final MongoTemplate mongo = mock(MongoTemplate.class);
    private final OrderRepository orders = mock(OrderRepository.class);
    private final InvoiceService invoices = mock(InvoiceService.class);
    private final AdminService admin = new AdminService(auth, mongo, orders, invoices);

    @Test
    void unauthenticatedRequestsAreRejectedBeforeAnyUserQuery() {
        when(auth.requireAdmin(null)).thenThrow(new ApiException(HttpStatus.UNAUTHORIZED, "AUTHENTICATION_REQUIRED", "Sign in to continue."));
        ApiException error = assertThrows(ApiException.class, () -> admin.users(null, 1, 10, null));
        assertEquals(HttpStatus.UNAUTHORIZED, error.getStatus());
        verifyNoInteractions(mongo);
    }

    @Test
    void unauthenticatedOrdersQueryIsRejected() {
        when(auth.requireAdmin(null)).thenThrow(new ApiException(HttpStatus.UNAUTHORIZED, "AUTHENTICATION_REQUIRED", "Sign in to continue."));
        ApiException error = assertThrows(ApiException.class, () -> admin.orders(null, 1, 10, null, null, null));
        assertEquals(HttpStatus.UNAUTHORIZED, error.getStatus());
        verifyNoInteractions(orders);
    }

    @Test
    void updateOrderStatusUpdatesAndSaves() {
        String token = "Bearer admin-secret-token";
        String orderId = "60c72b2f9b1d8b2bad000001";
        Order existing = new Order();
        existing.setId(orderId);
        existing.setOrderStatus("paid");

        when(orders.findById(orderId)).thenReturn(Optional.of(existing));
        when(orders.save(any(Order.class))).thenAnswer(invocation -> invocation.getArgument(0));

        Order updated = admin.updateOrderStatus(token, orderId, "assembling");
        assertEquals("assembling", updated.getOrderStatus());
        assertNotNull(updated.getUpdatedAt());
        verify(orders).save(existing);
    }
}
