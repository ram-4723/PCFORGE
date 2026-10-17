package com.pcforge.services;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.pcforge.dto.PaymentVerifyRequest;
import com.pcforge.dto.PaymentFailedRequest;
import com.pcforge.exception.ApiException;
import com.pcforge.models.Component;
import com.pcforge.models.Order;
import com.pcforge.repositories.ComponentRepository;
import com.pcforge.repositories.OrderRepository;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.time.Instant;
import java.util.HexFormat;
import java.util.Map;
import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import org.springframework.data.mongodb.core.FindAndModifyOptions;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.data.mongodb.core.query.Query;
import org.springframework.data.mongodb.core.query.Update;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;

@Service
public class PaymentService {
    private final OrderService orderService;
    private final OrderRepository orders;
    private final ComponentRepository components;
    private final MongoTemplate mongo;
    private final RazorpayGateway gateway;
    private final InvoiceService invoices;
    private final ObjectMapper mapper;
    private final TestCatalogueGuard testCatalogueGuard;

    public PaymentService(OrderService orderService, OrderRepository orders, ComponentRepository components,
                          MongoTemplate mongo, RazorpayGateway gateway, InvoiceService invoices, ObjectMapper mapper, TestCatalogueGuard testCatalogueGuard) {
        this.orderService = orderService; this.orders = orders; this.components = components;
        this.mongo = mongo; this.gateway = gateway; this.invoices = invoices; this.mapper = mapper; this.testCatalogueGuard = testCatalogueGuard;
    }

    public record Checkout(String keyId, String razorpayOrderId, long amountPaise, String currency) { }
    public record Verified(Order order, String result) { }

    public Checkout createCheckout(String id, String accessToken, String idempotencyKey) {
        Order order = orderService.owned(id, accessToken);
        if ("paid".equals(order.getPaymentStatus())) throw new ApiException(HttpStatus.CONFLICT, "ORDER_ALREADY_PAID", "This order has already been paid.");
        if (!"pending".equals(order.getPaymentStatus()) && !"failed".equals(order.getPaymentStatus()))
            throw new ApiException(HttpStatus.CONFLICT, "PAYMENT_NOT_RETRYABLE", "Create a new order to retry payment for an order that is no longer payable.");
        verifyOrderSnapshot(order);
        verifyCurrentAvailability(order);
        if ("pending".equals(order.getPaymentStatus()) && order.getRazorpayOrderId() != null) return checkout(order);
        if (idempotencyKey == null || !idempotencyKey.matches("[A-Za-z0-9_-]{16,80}"))
            throw new ApiException(HttpStatus.BAD_REQUEST, "INVALID_IDEMPOTENCY_KEY", "Idempotency-Key must contain 16 to 80 letters, digits, underscores, or hyphens.");
        long amountPaise;
        try { amountPaise = Math.multiplyExact(order.getTotalInr(), 100L); }
        catch (ArithmeticException overflow) { throw new ApiException(HttpStatus.UNPROCESSABLE_ENTITY, "INVALID_TOTAL", "Order amount is outside the supported payment range."); }
        if (amountPaise <= 0) throw new ApiException(HttpStatus.UNPROCESSABLE_ENTITY, "INVALID_TOTAL", "A zero-value order cannot be sent to Razorpay.");

        Instant now = Instant.now();
        Criteria lockAvailable = new Criteria().orOperator(
                Criteria.where("paymentLockUntil").exists(false),
                Criteria.where("paymentLockUntil").is(null),
                Criteria.where("paymentLockUntil").lt(now));
        Criteria payable = new Criteria().orOperator(Criteria.where("paymentStatus").is("pending"), Criteria.where("paymentStatus").is("failed"));
        Criteria retryableProviderOrder = new Criteria().orOperator(Criteria.where("razorpayOrderId").is(null), Criteria.where("paymentStatus").is("failed"));
        Query claim = Query.query(new Criteria().andOperator(
                Criteria.where("_id").is(id), Criteria.where("accessTokenHash").is(OrderService.hashToken(accessToken)),
                payable, retryableProviderOrder, lockAvailable));
        Order claimed = mongo.findAndModify(claim, new Update().set("paymentStatus", "pending").set("orderStatus", "awaiting_payment")
                        .set("razorpayOrderId", null).set("razorpayPaymentId", null).set("razorpayAmountPaise", null)
                        .set("paymentRequestKey", idempotencyKey)
                        .set("paymentLockUntil", now.plusSeconds(120)), FindAndModifyOptions.options().returnNew(true), Order.class);
        if (claimed == null) {
            Order latest = orderService.owned(id, accessToken);
            if ("pending".equals(latest.getPaymentStatus()) && latest.getRazorpayOrderId() != null) return checkout(latest);
            throw new ApiException(HttpStatus.CONFLICT, "PAYMENT_INITIALIZING", "A payment attempt is already being prepared. Retry shortly.");
        }
        try {
            RazorpayGateway.CreatedOrder created = gateway.createOrder(amountPaise, order.getOrderNumber());
            if (created == null || created.id() == null || created.amount() != amountPaise || !"INR".equals(created.currency()))
                throw new ApiException(HttpStatus.BAD_GATEWAY, "PAYMENT_PROVIDER_ERROR", "Razorpay returned an invalid payment order.");
            Query save = Query.query(Criteria.where("_id").is(id).and("paymentRequestKey").is(idempotencyKey));
            Order stored = mongo.findAndModify(save, new Update().set("razorpayOrderId", created.id())
                    .set("razorpayAmountPaise", amountPaise).set("paymentLockUntil", null).inc("version", 1),
                    FindAndModifyOptions.options().returnNew(true), Order.class);
            if (stored == null) throw new ApiException(HttpStatus.CONFLICT, "PAYMENT_ATTEMPT_CHANGED", "The payment attempt changed while it was being prepared.");
            return checkout(stored);
        } catch (RuntimeException failure) {
            mongo.updateFirst(Query.query(Criteria.where("_id").is(id).and("paymentRequestKey").is(idempotencyKey)),
                    new Update().set("paymentLockUntil", Instant.now()), Order.class);
            throw failure;
        }
    }

    public Verified verify(String id, String accessToken, PaymentVerifyRequest request) {
        Order order = orderService.owned(id, accessToken);
        if ("paid".equals(order.getPaymentStatus())) {
            if (request.razorpayPaymentId().equals(order.getRazorpayPaymentId())) return new Verified(order, "paid");
            throw new ApiException(HttpStatus.CONFLICT, "ORDER_ALREADY_PAID", "A different payment has already completed this order.");
        }
        if (order.getRazorpayOrderId() == null) throw new ApiException(HttpStatus.CONFLICT, "PAYMENT_NOT_STARTED", "No payment order exists for this PCForge order.");
        if (!gateway.verifyCheckoutSignature(order.getRazorpayOrderId(), request.razorpayPaymentId(), request.razorpaySignature())) throw new ApiException(HttpStatus.BAD_REQUEST, "INVALID_PAYMENT_SIGNATURE", "Razorpay payment signature verification failed.");
        RazorpayGateway.Payment payment = gateway.getPayment(request.razorpayPaymentId());
        validateProviderPayment(order, payment);
        if (!"captured".equals(payment.getStatus())) {
            if ("failed".equals(payment.getStatus())) markFailed(order.getId(), payment.getId());
            Order refreshed = orders.findById(order.getId()).orElse(order);
            return new Verified(refreshed, "failed".equals(payment.getStatus()) ? "failed" : "pending");
        }
        Order paid = markPaid(order, payment.getId());
        Order withInvoice = invoices.issueForPaidOrder(paid.getId());
        return new Verified(withInvoice, "paid");
    }

    /** Records a provider-confirmed failure so the next attempt receives a fresh provider order. */
    public Verified fail(String id, String accessToken, PaymentFailedRequest request) {
        Order order = orderService.owned(id, accessToken);
        if ("paid".equals(order.getPaymentStatus())) throw new ApiException(HttpStatus.CONFLICT, "ORDER_ALREADY_PAID", "This order has already been paid.");
        if (order.getRazorpayOrderId() == null) throw new ApiException(HttpStatus.CONFLICT, "PAYMENT_NOT_STARTED", "No payment order exists for this PCForge order.");
        RazorpayGateway.Payment payment = gateway.getPayment(request.razorpayPaymentId());
        validateProviderPayment(order, payment);
        if (!"failed".equals(payment.getStatus())) throw new ApiException(HttpStatus.CONFLICT, "PAYMENT_NOT_FAILED", "Razorpay has not confirmed this payment as failed.");
        markFailed(order.getId(), payment.getId());
        Order refreshed = orders.findById(order.getId()).orElse(order);
        return new Verified(refreshed, "failed");
    }

    public String handleWebhook(byte[] rawBody, String signature, String eventId) {
        if (!gateway.webhookConfigured()) throw new ApiException(HttpStatus.SERVICE_UNAVAILABLE, "WEBHOOK_NOT_CONFIGURED", "Razorpay webhook verification is not configured.");
        if (rawBody == null || rawBody.length == 0 || rawBody.length > 1_000_000 || !constantEquals(hmacHex(gateway.webhookSecret(), rawBody), signature))
            throw new ApiException(HttpStatus.BAD_REQUEST, "INVALID_WEBHOOK_SIGNATURE", "Webhook signature verification failed.");
        try {
            JsonNode root = mapper.readTree(rawBody);
            String event = root.path("event").asText();
            JsonNode paymentNode = root.path("payload").path("payment").path("entity");
            if (!event.equals("payment.captured") && !event.equals("payment.failed")) return "ignored";
            String providerOrderId = paymentNode.path("order_id").asText();
            String paymentId = paymentNode.path("id").asText();
            Long amount = paymentNode.path("amount").isNumber() ? paymentNode.path("amount").longValue() : null;
            String currency = paymentNode.path("currency").asText();
            Order order = orders.findByRazorpayOrderId(providerOrderId).orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "ORDER_NOT_FOUND", "Payment order is not associated with a PCForge order."));
            String dedupeId = eventId == null || eventId.isBlank() ? hmacHex("webhook-id", rawBody) : eventId;
            if (dedupeId.length() > 200) throw new ApiException(HttpStatus.BAD_REQUEST, "INVALID_WEBHOOK", "Webhook event ID is invalid.");
            if (order.getProcessedWebhookIds() != null && order.getProcessedWebhookIds().contains(dedupeId)) return "duplicate";
            if (amount == null || !amount.equals(order.getRazorpayAmountPaise()) || !"INR".equals(currency))
                throw new ApiException(HttpStatus.CONFLICT, "PAYMENT_AMOUNT_MISMATCH", "Webhook amount or currency does not match the stored payment order.");
            if (event.equals("payment.captured")) {
                if (!"captured".equals(paymentNode.path("status").asText())) throw new ApiException(HttpStatus.CONFLICT, "PAYMENT_NOT_CAPTURED", "The webhook does not report a captured payment.");
                Order paid = markPaid(order, paymentId);
                invoices.issueForPaidOrder(paid.getId());
            } else {
                if (!"failed".equals(paymentNode.path("status").asText())) throw new ApiException(HttpStatus.CONFLICT, "PAYMENT_NOT_FAILED", "The webhook does not report a failed payment.");
                markFailed(order.getId(), paymentId);
            }
            mongo.updateFirst(Query.query(Criteria.where("_id").is(order.getId())), new Update().addToSet("processedWebhookIds", dedupeId), Order.class);
            return "processed";
        } catch (ApiException e) { throw e; }
        catch (Exception e) { throw new ApiException(HttpStatus.BAD_REQUEST, "INVALID_WEBHOOK", "Webhook body is invalid."); }
    }

    private void verifyCurrentAvailability(Order order) {
        for (Order.Item item : order.getItems()) {
            Component component = components.findByIdAndActiveTrue(item.getComponentId()).orElseThrow(() -> new ApiException(HttpStatus.CONFLICT, "COMPONENT_UNAVAILABLE", "An ordered component is no longer available."));
            if (!"in_stock".equals(component.getStockStatus()) || !item.getUnitPriceInr().equals(component.getPriceInr())
                    || component.isDemoData() && !testCatalogueGuard.isEnabled())
                throw new ApiException(HttpStatus.CONFLICT, "ORDER_REVIEW_REQUIRED", "Component price or availability changed. Create a new order from the current catalog.");
        }
    }
    private void verifyOrderSnapshot(Order order) {
        if (order.getItems() == null || order.getItems().isEmpty() || order.getItems().size() > 12)
            throw new ApiException(HttpStatus.CONFLICT, "INVALID_ORDER_SNAPSHOT", "The order items are incomplete. Create a new order from the current catalog.");
        try {
            long subtotal = 0;
            for (Order.Item item : order.getItems()) {
                if (item == null || item.getComponentId() == null || !item.getComponentId().matches("[a-fA-F0-9]{24}")
                        || item.getQuantity() == null || item.getQuantity() < 1 || item.getQuantity() > 100
                        || item.getUnitPriceInr() == null || item.getUnitPriceInr() <= 0 || item.getLineTotalInr() == null)
                    throw new ArithmeticException("invalid item snapshot");
                long line = Math.multiplyExact(item.getUnitPriceInr(), item.getQuantity());
                if (line != item.getLineTotalInr()) throw new ArithmeticException("invalid line total");
                subtotal = Math.addExact(subtotal, line);
            }
            if (order.getSubtotalInr() == null || order.getSubtotalInr() != subtotal
                    || order.getTaxInr() == null || order.getTaxInr() < 0
                    || order.getDiscountInr() == null || order.getDiscountInr() < 0
                    || order.getTotalInr() == null || Math.subtractExact(Math.addExact(subtotal, order.getTaxInr()), order.getDiscountInr()) != order.getTotalInr())
                throw new ArithmeticException("invalid order total");
        } catch (ArithmeticException invalidSnapshot) {
            throw new ApiException(HttpStatus.CONFLICT, "INVALID_ORDER_SNAPSHOT", "The stored order total is invalid. Create a new order from the current catalog.");
        }
    }
    private Order markPaid(Order order, String paymentId) {
        if ("paid".equals(order.getPaymentStatus())) {
            if (paymentId.equals(order.getRazorpayPaymentId())) return order;
            throw new ApiException(HttpStatus.CONFLICT, "ORDER_ALREADY_PAID", "A different payment has already completed this order.");
        }
        Query query = Query.query(Criteria.where("_id").is(order.getId()).and("paymentStatus").ne("paid"));
        Order updated = mongo.findAndModify(query, new Update().set("paymentStatus", "paid").set("orderStatus", "confirmed")
                        .set("razorpayPaymentId", paymentId).inc("version", 1), FindAndModifyOptions.options().returnNew(true), Order.class);
        if (updated != null) return updated;
        Order latest = orders.findById(order.getId()).orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "ORDER_NOT_FOUND", "Order not found."));
        if ("paid".equals(latest.getPaymentStatus()) && paymentId.equals(latest.getRazorpayPaymentId())) return latest;
        throw new ApiException(HttpStatus.CONFLICT, "ORDER_ALREADY_PAID", "A different payment has already completed this order.");
    }
    private void markFailed(String id, String paymentId) {
        mongo.updateFirst(Query.query(Criteria.where("_id").is(id).and("paymentStatus").is("pending")),
                new Update().set("paymentStatus", "failed").set("razorpayPaymentId", paymentId).inc("version", 1), Order.class);
    }
    private void validateProviderPayment(Order order, RazorpayGateway.Payment payment) {
        if (payment == null || !order.getRazorpayOrderId().equals(payment.getOrderId())
                || !"INR".equals(payment.getCurrency()) || payment.getAmount() == null
                || !payment.getAmount().equals(order.getRazorpayAmountPaise()))
            throw new ApiException(HttpStatus.CONFLICT, "PAYMENT_AMOUNT_MISMATCH", "Razorpay payment details do not match the stored order amount and currency.");
    }
    private Checkout checkout(Order order) { return new Checkout(gateway.keyId(), order.getRazorpayOrderId(), order.getRazorpayAmountPaise(), "INR"); }
    public static String paymentSignature(String orderId, String paymentId, String secret) { return hmacHex(secret, (orderId + "|" + paymentId).getBytes(StandardCharsets.UTF_8)); }
    public static String hmacHex(String secret, byte[] data) {
        try { Mac mac = Mac.getInstance("HmacSHA256"); mac.init(new SecretKeySpec(secret.getBytes(StandardCharsets.UTF_8), "HmacSHA256")); return HexFormat.of().formatHex(mac.doFinal(data)); }
        catch (Exception e) { throw new IllegalStateException(e); }
    }
    private static boolean constantEquals(String expected, String actual) {
        if (expected == null || actual == null) return false;
        return MessageDigest.isEqual(expected.getBytes(StandardCharsets.US_ASCII), actual.getBytes(StandardCharsets.US_ASCII));
    }
}
