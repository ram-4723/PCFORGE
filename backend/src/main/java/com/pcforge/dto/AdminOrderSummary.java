package com.pcforge.dto;

import com.pcforge.models.Order;
import java.time.Instant;

public record AdminOrderSummary(
    String id,
    String orderNumber,
    String customerName,
    String customerEmail,
    String customerPhone,
    String customerAddress,
    int itemCount,
    Long totalInr,
    Long subtotalInr,
    Long taxInr,
    String orderStatus,
    String paymentStatus,
    String invoiceNumber,
    Instant createdAt,
    Instant updatedAt
) {
    public static AdminOrderSummary from(Order order) {
        String name = order.getCustomer() != null ? order.getCustomer().getName() : "Customer";
        String email = order.getCustomer() != null ? order.getCustomer().getEmail() : "—";
        String phone = order.getCustomer() != null ? order.getCustomer().getPhone() : "—";
        String address = order.getCustomer() != null ? order.getCustomer().getAddress() : "—";
        int count = order.getItems() != null ? order.getItems().size() : 0;
        return new AdminOrderSummary(
            order.getId(),
            order.getOrderNumber() != null ? order.getOrderNumber() : order.getId().substring(0, 8).toUpperCase(),
            name,
            email,
            phone,
            address,
            count,
            order.getTotalInr() != null ? order.getTotalInr() : 0L,
            order.getSubtotalInr() != null ? order.getSubtotalInr() : 0L,
            order.getTaxInr() != null ? order.getTaxInr() : 0L,
            order.getOrderStatus() != null ? order.getOrderStatus() : "awaiting_payment",
            order.getPaymentStatus() != null ? order.getPaymentStatus() : "pending",
            order.getInvoiceNumber(),
            order.getCreatedAt(),
            order.getUpdatedAt()
        );
    }
}
