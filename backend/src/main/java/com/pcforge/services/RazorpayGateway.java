package com.pcforge.services;

import com.pcforge.exception.ApiException;
import com.razorpay.RazorpayClient;
import org.json.JSONObject;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;

@Component
public class RazorpayGateway {
    private final String keyId;
    private final String secret;
    private final String webhookSecret;

    public RazorpayGateway(@Value("${pcforge.razorpay.key-id:}") String keyId,
                           @Value("${pcforge.razorpay.key-secret:}") String secret,
                           @Value("${pcforge.razorpay.webhook-secret:}") String webhookSecret) {
        this.keyId = keyId; this.secret = secret; this.webhookSecret = webhookSecret;
    }

    public record CreatedOrder(String id, long amount, String currency) { }
    public static class Payment {
        private String id;
        private String orderId;
        private Long amount;
        private String currency;
        private String status;
        public String getId() { return id; }
        public String getOrderId() { return orderId; }
        public Long getAmount() { return amount; }
        public String getCurrency() { return currency; }
        public String getStatus() { return status; }
        public void setId(String v) { id = v; }
        public void setOrderId(String v) { orderId = v; }
        public void setAmount(Long v) { amount = v; }
        public void setCurrency(String v) { currency = v; }
        public void setStatus(String v) { status = v; }
    }

    public boolean testModeConfigured() { return keyId.startsWith("rzp_test_") && !secret.isBlank(); }
    public boolean webhookConfigured() { return testModeConfigured() && !webhookSecret.isBlank(); }
    public String keyId() { requireTestMode(); return keyId; }
    public String webhookSecret() { return webhookSecret; }
    public boolean verifyCheckoutSignature(String orderId, String paymentId, String signature) {
        if (secret.isBlank() || signature == null) return false;
        String expected = PaymentService.paymentSignature(orderId, paymentId, secret);
        return java.security.MessageDigest.isEqual(expected.getBytes(java.nio.charset.StandardCharsets.US_ASCII), signature.getBytes(java.nio.charset.StandardCharsets.US_ASCII));
    }

    public CreatedOrder createOrder(long amountPaise, String receipt) {
        requireTestMode();
        try {
            JSONObject request = new JSONObject();
            request.put("amount", amountPaise);
            request.put("currency", "INR");
            request.put("receipt", receipt);
            var created = client().orders.create(request);
            return new CreatedOrder(String.valueOf(created.get("id")), ((Number) created.get("amount")).longValue(), String.valueOf(created.get("currency")));
        } catch (Exception e) {
            throw new ApiException(HttpStatus.BAD_GATEWAY, "PAYMENT_PROVIDER_ERROR", "Razorpay could not create the payment order.");
        }
    }

    public Payment getPayment(String paymentId) {
        requireTestMode();
        try {
            var providerPayment = client().payments.fetch(paymentId);
            Payment payment = new Payment();
            payment.setId(providerPayment.has("id") ? String.valueOf(providerPayment.get("id")) : null);
            payment.setOrderId(providerPayment.has("order_id") ? String.valueOf(providerPayment.get("order_id")) : null);
            payment.setAmount(providerPayment.has("amount") ? ((Number) providerPayment.get("amount")).longValue() : null);
            payment.setCurrency(providerPayment.has("currency") ? String.valueOf(providerPayment.get("currency")) : null);
            payment.setStatus(providerPayment.has("status") ? String.valueOf(providerPayment.get("status")) : null);
            return payment;
        } catch (Exception e) {
            throw new ApiException(HttpStatus.BAD_GATEWAY, "PAYMENT_PROVIDER_ERROR", "Razorpay payment status could not be verified.");
        }
    }

    private RazorpayClient client() throws Exception { return new RazorpayClient(keyId, secret); }

    private void requireTestMode() {
        if (!testModeConfigured()) throw new ApiException(HttpStatus.SERVICE_UNAVAILABLE, "PAYMENTS_NOT_CONFIGURED", "Razorpay Test Mode keys are not configured.");
    }
}
