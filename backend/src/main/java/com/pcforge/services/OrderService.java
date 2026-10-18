package com.pcforge.services;

import com.pcforge.dto.OrderCreateRequest;
import com.pcforge.exception.ApiException;
import com.pcforge.models.Component;
import com.pcforge.models.Order;
import com.pcforge.models.PCBuild;
import com.pcforge.repositories.ComponentRepository;
import com.pcforge.repositories.OrderRepository;
import com.pcforge.repositories.PCBuildRepository;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.HexFormat;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import org.springframework.dao.DuplicateKeyException;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;

@Service
public class OrderService {
    private final PCBuildRepository builds;
    private final ComponentRepository components;
    private final OrderRepository orders;
    private final TestCatalogueGuard testCatalogueGuard;
    private final int taxRateBps;

    public OrderService(PCBuildRepository builds, ComponentRepository components, OrderRepository orders, TestCatalogueGuard testCatalogueGuard,
                        @Value("${pcforge.invoice.tax-rate-bps:0}") int taxRateBps) {
        this.builds = builds; this.components = components; this.orders = orders; this.testCatalogueGuard = testCatalogueGuard;
        if (taxRateBps < 0 || taxRateBps > 2800) throw new IllegalArgumentException("Invoice tax rate must be between 0 and 2800 basis points.");
        this.taxRateBps = taxRateBps;
    }

    public record Created(Order order, String accessToken) { }

    public Created create(OrderCreateRequest request, String buildToken, String idempotencyKey) {
        if (idempotencyKey == null || !idempotencyKey.matches("[A-Za-z0-9_-]{16,80}"))
            throw new ApiException(HttpStatus.BAD_REQUEST, "INVALID_IDEMPOTENCY_KEY", "Idempotency-Key must contain 16 to 80 letters, digits, underscores, or hyphens.");
        PCBuild build = builds.findByIdAndSessionTokenHash(request.buildId(), hashToken(buildToken))
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "BUILD_NOT_FOUND", "Saved build not found."));
        String creationKeyHash = hashToken(build.getId() + "|" + idempotencyKey);
        String quantityFingerprint = request.quantities() == null || request.quantities().isEmpty() ? "" : "|" + new java.util.TreeMap<>(request.quantities());
        String requestHash = hashToken(build.getId() + "|" + request.customer().name().trim() + "|" + request.customer().email().trim() + "|" + request.customer().phone().trim() + "|" + request.customer().address().trim() + quantityFingerprint);
        var existing = orders.findByCreationKeyHash(creationKeyHash);
        if (existing.isPresent()) {
            Order previous = existing.get();
            if (!requestHash.equals(previous.getCreationRequestHash())) throw new ApiException(HttpStatus.CONFLICT, "IDEMPOTENCY_KEY_REUSED", "This idempotency key was already used for a different order request.");
            return new Created(previous, accessToken(buildToken, idempotencyKey, previous.getId()));
        }
        List<String> ids = build.getSelectedComponents();
        if (ids == null || ids.isEmpty() || ids.size() > 12 || new HashSet<>(ids).size() != ids.size())
            throw new ApiException(HttpStatus.CONFLICT, "BUILD_UNAVAILABLE", "The saved build no longer contains a valid component selection.");
        Map<String, Integer> quantities = request.quantities() == null ? Map.of() : request.quantities();
        if (quantities.size() > ids.size() || quantities.keySet().stream().anyMatch(id -> !ids.contains(id))
                || quantities.values().stream().anyMatch(quantity -> quantity == null || quantity < 1 || quantity > 10))
            throw new ApiException(HttpStatus.BAD_REQUEST, "INVALID_QUANTITY", "Each cart quantity must be between 1 and 10 for a selected component.");
        List<Component> selected = java.util.stream.StreamSupport.stream(components.findAllById(ids).spliterator(), false).toList();
        if (selected.size() != ids.size()) throw unavailable();
        var byId = selected.stream().collect(java.util.stream.Collectors.toMap(Component::getId, c -> c));
        Order order = new Order();
        order.setOrderNumber("PF-" + UUID.randomUUID().toString().replace("-", "").toUpperCase());
        order.setBuild(build.getId());
        List<Order.Item> snapshots = new ArrayList<>();
        long subtotal = 0;
        for (String id : ids) {
            Component component = byId.get(id);
            if (component == null || !component.isActive() || !"in_stock".equals(component.getStockStatus()) || component.getPriceInr() == null || component.getPriceInr() < 0)
                throw unavailable();
            if (component.isDemoData() && !testCatalogueGuard.isEnabled()) throw unavailable();
            Order.Item item = new Order.Item();
            item.setComponentId(component.getId()); item.setName(component.getName()); item.setBrand(component.getBrand());
            item.setModel(component.getModel()); item.setCategory(component.getCategory());
            int quantity = quantities.getOrDefault(id, 1);
            long lineTotal;
            try { lineTotal = Math.multiplyExact(component.getPriceInr(), quantity); subtotal = Math.addExact(subtotal, lineTotal); }
            catch (ArithmeticException overflow) { throw new ApiException(HttpStatus.UNPROCESSABLE_ENTITY, "INVALID_TOTAL", "The selected components exceed the supported order amount."); }
            item.setQuantity(quantity);
            item.setUnitPriceInr(component.getPriceInr()); item.setLineTotalInr(lineTotal);
            snapshots.add(item);
        }
        long tax = java.math.BigDecimal.valueOf(subtotal).multiply(java.math.BigDecimal.valueOf(taxRateBps))
                .divide(java.math.BigDecimal.valueOf(10_000), 0, java.math.RoundingMode.HALF_UP).longValueExact();
        Order.Customer customer = new Order.Customer();
        customer.setName(request.customer().name().trim()); customer.setEmail(request.customer().email().trim());
        customer.setPhone(request.customer().phone().trim()); customer.setAddress(request.customer().address().trim());
        order.setItems(snapshots); order.setSubtotalInr(subtotal); order.setTaxRateBps(taxRateBps);
        order.setTaxInr(tax); order.setDiscountInr(0L);
        try { order.setTotalInr(Math.addExact(subtotal, tax)); }
        catch (ArithmeticException overflow) { throw new ApiException(HttpStatus.UNPROCESSABLE_ENTITY, "INVALID_TOTAL", "The order total exceeds the supported amount."); }
        order.setCustomer(customer);
        order.setCreationKeyHash(creationKeyHash); order.setCreationRequestHash(requestHash);
        order.setId(new org.bson.types.ObjectId().toHexString());
        String accessToken = accessToken(buildToken, idempotencyKey, order.getId());
        order.setAccessTokenHash(hashToken(accessToken));
        try {
            Order saved = orders.save(order);
            return new Created(saved, accessToken);
        } catch (DuplicateKeyException concurrentRetry) {
            Order previous = orders.findByCreationKeyHash(creationKeyHash).orElseThrow(() -> concurrentRetry);
            if (!requestHash.equals(previous.getCreationRequestHash())) throw new ApiException(HttpStatus.CONFLICT, "IDEMPOTENCY_KEY_REUSED", "This idempotency key was already used for a different order request.");
            return new Created(previous, accessToken(buildToken, idempotencyKey, previous.getId()));
        }
    }

    public Order get(String id, String accessToken) { return owned(id, accessToken); }

    public Order owned(String id, String accessToken) {
        if (id == null || !id.matches("[a-fA-F0-9]{24}")) throw new ApiException(HttpStatus.BAD_REQUEST, "INVALID_ID", "Order ID must be a 24-character MongoDB ObjectId.");
        if (accessToken == null || accessToken.length() < 32 || accessToken.length() > 128) throw notFound();
        return orders.findByIdAndAccessTokenHash(id, hashToken(accessToken)).orElseThrow(OrderService::notFound);
    }

    private static ApiException unavailable() { return new ApiException(HttpStatus.CONFLICT, "COMPONENT_UNAVAILABLE", "A component in this build is no longer available at the current catalog price."); }
    private static ApiException notFound() { return new ApiException(HttpStatus.NOT_FOUND, "ORDER_NOT_FOUND", "Order not found."); }
    private static String accessToken(String buildToken, String key, String orderId) { return hashToken("order-access|" + buildToken + "|" + key + "|" + orderId); }
    public static String hashToken(String value) {
        if (value == null) return "";
        try { return HexFormat.of().formatHex(MessageDigest.getInstance("SHA-256").digest(value.getBytes(StandardCharsets.UTF_8))); }
        catch (Exception e) { throw new IllegalStateException(e); }
    }
}
