package com.pcforge.services;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.pcforge.dto.PaymentVerifyRequest;
import com.pcforge.exception.ApiException;
import com.pcforge.models.Component;
import com.pcforge.models.Order;
import com.pcforge.repositories.ComponentRepository;
import com.pcforge.repositories.OrderRepository;
import java.util.List;
import org.junit.jupiter.api.Test;
import org.springframework.data.mongodb.core.FindAndModifyOptions;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.query.Query;
import org.springframework.data.mongodb.core.query.Update;
import org.springframework.http.HttpStatus;

class PaymentServiceTest {
    @Test void createsProviderOrderFromServerAmountAndReusesItAfterRetry() {
        OrderService owner = mock(OrderService.class); OrderRepository orders = mock(OrderRepository.class);
        ComponentRepository components = mock(ComponentRepository.class); MongoTemplate mongo = mock(MongoTemplate.class);
        RazorpayGateway gateway = mock(RazorpayGateway.class); InvoiceService invoices = mock(InvoiceService.class);
        Order order = pendingOrder(); when(owner.owned("0123456789abcdef01234567", "O".repeat(64))).thenReturn(order);
        Component component = new Component(); component.setId("111111111111111111111111"); component.setPriceInr(3540L); component.setActive(true); component.setStockStatus("in_stock");
        when(components.findByIdAndActiveTrue(component.getId())).thenReturn(java.util.Optional.of(component));
        Order claimed = pendingOrder(); claimed.setPaymentRequestKey("key-1234567890123456");
        Order stored = pendingOrder(); stored.setRazorpayOrderId("order_provider_1"); stored.setRazorpayAmountPaise(354000L);
        when(mongo.findAndModify(any(Query.class), any(Update.class), any(FindAndModifyOptions.class), eq(Order.class))).thenReturn(claimed, stored);
        when(gateway.createOrder(354000L, order.getOrderNumber())).thenReturn(new RazorpayGateway.CreatedOrder("order_provider_1", 354000L, "INR"));
        when(gateway.keyId()).thenReturn("rzp_test_demo");
        PaymentService service = new PaymentService(owner, orders, components, mongo, gateway, invoices, new ObjectMapper(), mock(TestCatalogueGuard.class));
        var result = service.createCheckout(order.getId(), "O".repeat(64), "key-1234567890123456");
        assertEquals(354000L, result.amountPaise()); assertEquals("order_provider_1", result.razorpayOrderId());
        verify(gateway).createOrder(354000L, order.getOrderNumber());
    }

    @Test void rejectsProviderAmountMismatchBeforeMarkingPaid() {
        OrderService owner = mock(OrderService.class); OrderRepository orders = mock(OrderRepository.class);
        RazorpayGateway gateway = mock(RazorpayGateway.class); InvoiceService invoices = mock(InvoiceService.class);
        Order order = pendingOrder(); order.setRazorpayOrderId("order_server"); order.setRazorpayAmountPaise(354000L);
        when(owner.owned(order.getId(), "O".repeat(64))).thenReturn(order);
        when(gateway.verifyCheckoutSignature("order_server", "pay_abc123", "a".repeat(64))).thenReturn(true);
        RazorpayGateway.Payment response = new RazorpayGateway.Payment(); response.setId("pay_abc123"); response.setOrderId("order_server"); response.setAmount(100L); response.setCurrency("INR"); response.setStatus("captured");
        when(gateway.getPayment("pay_abc123")).thenReturn(response);
        PaymentService service = new PaymentService(owner, orders, mock(ComponentRepository.class), mock(MongoTemplate.class), gateway, invoices, new ObjectMapper(), mock(TestCatalogueGuard.class));
        ApiException error = assertThrows(ApiException.class, () -> service.verify(order.getId(), "O".repeat(64), new PaymentVerifyRequest("pay_abc123", "a".repeat(64))));
        assertEquals(HttpStatus.CONFLICT, error.getStatus());
        verifyNoInteractions(invoices);
    }

    @Test void duplicateVerifiedCallbackIsIdempotent() {
        OrderService owner = mock(OrderService.class); Order order = pendingOrder();
        order.setPaymentStatus("paid"); order.setRazorpayPaymentId("pay_abc123");
        when(owner.owned(order.getId(), "O".repeat(64))).thenReturn(order);
        RazorpayGateway gateway = mock(RazorpayGateway.class);
        PaymentService service = new PaymentService(owner, mock(OrderRepository.class), mock(ComponentRepository.class), mock(MongoTemplate.class), gateway, mock(InvoiceService.class), new ObjectMapper(), mock(TestCatalogueGuard.class));
        var result = service.verify(order.getId(), "O".repeat(64), new PaymentVerifyRequest("pay_abc123", "a".repeat(64)));
        assertEquals("paid", result.result());
        verifyNoInteractions(gateway);
    }

    @Test void failedPaymentCanBeRetriedWithANewProviderOrder() {
        OrderService owner = mock(OrderService.class); ComponentRepository components = mock(ComponentRepository.class);
        MongoTemplate mongo = mock(MongoTemplate.class); RazorpayGateway gateway = mock(RazorpayGateway.class);
        Order order = pendingOrder(); order.setPaymentStatus("failed"); order.setRazorpayOrderId("order_failed"); order.setRazorpayAmountPaise(354000L);
        when(owner.owned(order.getId(), "O".repeat(64))).thenReturn(order);
        Component component = new Component(); component.setId("111111111111111111111111"); component.setPriceInr(3540L); component.setActive(true); component.setStockStatus("in_stock");
        when(components.findByIdAndActiveTrue(component.getId())).thenReturn(java.util.Optional.of(component));
        Order claimed = pendingOrder(); claimed.setPaymentRequestKey("retry-key-12345678");
        Order stored = pendingOrder(); stored.setRazorpayOrderId("order_provider_retry"); stored.setRazorpayAmountPaise(354000L);
        when(mongo.findAndModify(any(Query.class), any(Update.class), any(FindAndModifyOptions.class), eq(Order.class))).thenReturn(claimed, stored);
        when(gateway.createOrder(354000L, order.getOrderNumber())).thenReturn(new RazorpayGateway.CreatedOrder("order_provider_retry", 354000L, "INR"));
        when(gateway.keyId()).thenReturn("rzp_test_demo");

        PaymentService service = new PaymentService(owner, mock(OrderRepository.class), components, mongo, gateway, mock(InvoiceService.class), new ObjectMapper(), mock(TestCatalogueGuard.class));
        var retry = service.createCheckout(order.getId(), "O".repeat(64), "retry-key-12345678");

        assertEquals("order_provider_retry", retry.razorpayOrderId());
        verify(gateway).createOrder(354000L, order.getOrderNumber());
    }

    @Test void rejectsCorruptedServerOrderTotalsBeforeContactingProvider() {
        OrderService owner = mock(OrderService.class); RazorpayGateway gateway = mock(RazorpayGateway.class);
        Order order = pendingOrder(); order.setTotalInr(99L);
        when(owner.owned(order.getId(), "O".repeat(64))).thenReturn(order);
        PaymentService service = new PaymentService(owner, mock(OrderRepository.class), mock(ComponentRepository.class), mock(MongoTemplate.class), gateway, mock(InvoiceService.class), new ObjectMapper(), mock(TestCatalogueGuard.class));

        ApiException error = assertThrows(ApiException.class, () -> service.createCheckout(order.getId(), "O".repeat(64), "key-1234567890123456"));

        assertEquals("INVALID_ORDER_SNAPSHOT", error.getCode());
        verifyNoInteractions(gateway);
    }

    @Test void failedProviderPaymentMarksOrderUnpaidAndDoesNotIssueInvoice() {
        OrderService owner = mock(OrderService.class); OrderRepository orders = mock(OrderRepository.class);
        MongoTemplate mongo = mock(MongoTemplate.class); RazorpayGateway gateway = mock(RazorpayGateway.class);
        InvoiceService invoices = mock(InvoiceService.class);
        Order order = pendingOrder(); order.setRazorpayOrderId("order_server"); order.setRazorpayAmountPaise(354000L);
        when(owner.owned(order.getId(), "O".repeat(64))).thenReturn(order);
        when(gateway.verifyCheckoutSignature("order_server", "pay_abc123", "a".repeat(64))).thenReturn(true);
        RazorpayGateway.Payment response = new RazorpayGateway.Payment(); response.setId("pay_abc123"); response.setOrderId("order_server"); response.setAmount(354000L); response.setCurrency("INR"); response.setStatus("failed");
        when(gateway.getPayment("pay_abc123")).thenReturn(response);
        Order failed = pendingOrder(); failed.setPaymentStatus("failed");
        when(orders.findById(order.getId())).thenReturn(java.util.Optional.of(failed));
        PaymentService service = new PaymentService(owner, orders, mock(ComponentRepository.class), mongo, gateway, invoices, new ObjectMapper(), mock(TestCatalogueGuard.class));

        var result = service.verify(order.getId(), "O".repeat(64), new PaymentVerifyRequest("pay_abc123", "a".repeat(64)));

        assertEquals("failed", result.result());
        assertEquals("failed", result.order().getPaymentStatus());
        verifyNoInteractions(invoices);
        verify(mongo).updateFirst(any(Query.class), any(Update.class), eq(Order.class));
    }

    private static Order pendingOrder() {
        Order order = new Order(); order.setId("0123456789abcdef01234567"); order.setOrderNumber("PF-TEST"); order.setPaymentStatus("pending"); order.setTotalInr(3540L);
        Order.Item item = new Order.Item(); item.setComponentId("111111111111111111111111"); item.setUnitPriceInr(3540L); item.setQuantity(1); item.setLineTotalInr(3540L); order.setItems(List.of(item));
        order.setSubtotalInr(3540L); order.setTaxInr(0L); order.setDiscountInr(0L);
        return order;
    }
}
