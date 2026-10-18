package com.pcforge.services;

import com.pcforge.exception.ApiException;
import com.razorpay.RazorpayClient;
import com.razorpay.RazorpayException;
import org.json.JSONObject;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.util.Base64;

@Component
public class RazorpayGateway {
    private static final Logger log = LoggerFactory.getLogger(RazorpayGateway.class);
    private final String keyId;
    private final String secret;
    private final String webhookSecret;
    private final HttpClient httpClient = HttpClient.newBuilder().connectTimeout(Duration.ofSeconds(10)).build();

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
            HttpRequest httpRequest = HttpRequest.newBuilder(URI.create("https://api.razorpay.com/v1/orders"))
                    .timeout(Duration.ofSeconds(20))
                    .header("Authorization", basicAuthorization())
                    .header("Content-Type", "application/json")
                    .POST(HttpRequest.BodyPublishers.ofString(request.toString(), StandardCharsets.UTF_8))
                    .build();
            HttpResponse<String> response = httpClient.send(httpRequest, HttpResponse.BodyHandlers.ofString(StandardCharsets.UTF_8));
            JSONObject body = new JSONObject(response.body());
            if (response.statusCode() < 200 || response.statusCode() >= 300) {
                String providerCode = body.has("error") && body.get("error") instanceof JSONObject error && error.has("code")
                        ? String.valueOf(error.get("code")) : null;
                log.warn("Razorpay create order failed: httpStatus={}, providerCode={}", response.statusCode(), safeCode(providerCode));
                throw new ApiException(HttpStatus.BAD_GATEWAY, "PAYMENT_PROVIDER_ERROR", "Razorpay could not create the payment order.");
            }
            return new CreatedOrder(body.getString("id"), readLong(body.get("amount")), body.getString("currency"));
        } catch (ApiException e) {
            throw e;
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
            logProviderFailure("create order", e);
            throw new ApiException(HttpStatus.BAD_GATEWAY, "PAYMENT_PROVIDER_ERROR", "Razorpay could not create the payment order.");
        } catch (Exception e) {
            logProviderFailure("create order", e);
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
            payment.setAmount(providerPayment.has("amount") ? readLong(providerPayment.get("amount")) : null);
            payment.setCurrency(providerPayment.has("currency") ? String.valueOf(providerPayment.get("currency")) : null);
            payment.setStatus(providerPayment.has("status") ? String.valueOf(providerPayment.get("status")) : null);
            return payment;
        } catch (Exception e) {
            logProviderFailure("fetch payment", e);
            throw new ApiException(HttpStatus.BAD_GATEWAY, "PAYMENT_PROVIDER_ERROR", "Razorpay payment status could not be verified.");
        }
    }

    /** Logs only provider status/code or exception type; never log credentials, request bodies, or raw error text. */
    private static void logProviderFailure(String operation, Exception failure) {
        if (failure instanceof RazorpayException provider) {
            log.warn("Razorpay {} failed: httpStatus={}, providerCode={}", operation, provider.getStatusCode(), safeCode(provider.getCode()));
        } else {
            StackTraceElement origin = failure.getStackTrace().length == 0 ? null : failure.getStackTrace()[0];
            String location = origin == null ? "unavailable" : origin.getClassName() + "." + origin.getMethodName() + ":" + origin.getLineNumber();
            log.warn("Razorpay {} failed: exceptionType={}, origin={}", operation, failure.getClass().getSimpleName(), location);
        }
    }

    private static String safeCode(String code) {
        return code != null && code.matches("[A-Za-z0-9_.-]{1,80}") ? code : "unavailable";
    }

    private static long readLong(Object value) {
        if (value instanceof Number number) return number.longValue();
        if (value instanceof String text) {
            try { return Long.parseLong(text); }
            catch (NumberFormatException ignored) { /* handled by the safe error below */ }
        }
        throw new IllegalStateException("Razorpay returned a missing or invalid numeric field.");
    }

    private String basicAuthorization() {
        String credentials = keyId + ":" + secret;
        return "Basic " + Base64.getEncoder().encodeToString(credentials.getBytes(StandardCharsets.UTF_8));
    }

    private RazorpayClient client() throws Exception { return new RazorpayClient(keyId, secret); }

    private void requireTestMode() {
        if (!testModeConfigured()) throw new ApiException(HttpStatus.SERVICE_UNAVAILABLE, "PAYMENTS_NOT_CONFIGURED", "Razorpay Test Mode keys are not configured.");
    }
}
