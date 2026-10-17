package com.pcforge.services;

import static org.junit.jupiter.api.Assertions.*;
import org.junit.jupiter.api.Test;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.pcforge.exception.ApiException;

class PaymentSignatureTest {
    @Test void verifiesOnlySignatureForStoredGatewayOrderAndPayment() {
        RazorpayGateway gateway = new RazorpayGateway("rzp_test_key", "test-secret", "");
        String signature = PaymentService.paymentSignature("order_server_123", "pay_abc123", "test-secret");
        assertTrue(gateway.verifyCheckoutSignature("order_server_123", "pay_abc123", signature));
        assertFalse(gateway.verifyCheckoutSignature("order_other_456", "pay_abc123", signature));
        assertFalse(gateway.verifyCheckoutSignature("order_server_123", "pay_abc123", "0".repeat(64)));
    }

    @Test void refusesLiveKeysForTestMode() {
        RazorpayGateway gateway = new RazorpayGateway("rzp_live_key", "secret", "");
        assertFalse(gateway.testModeConfigured());
    }

    @Test void verifiesWebhookAgainstExactRawBody() {
        RazorpayGateway gateway = new RazorpayGateway("rzp_test_key", "test-secret", "webhook-secret");
        PaymentService service = new PaymentService(null, null, null, null, gateway, null, new ObjectMapper(), null);
        byte[] body = "{\"event\":\"unknown.event\"}".getBytes(java.nio.charset.StandardCharsets.UTF_8);
        String signature = PaymentService.hmacHex("webhook-secret", body);
        assertEquals("ignored", service.handleWebhook(body, signature, "evt_demo_1"));
        byte[] changed = "{ \"event\":\"unknown.event\"}".getBytes(java.nio.charset.StandardCharsets.UTF_8);
        assertThrows(ApiException.class, () -> service.handleWebhook(changed, signature, "evt_demo_1"));
    }
}
