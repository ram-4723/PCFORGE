package com.pcforge.models;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.validation.Valid;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.Id;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.annotation.Version;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

@Document(collection = "orders")
public class Order {
    @Id private String id;
    @Indexed(unique = true, sparse = true) private String orderNumber;
    @Indexed private String build;
    @Valid private List<Item> items = new ArrayList<>();
    private Long subtotalInr;
    private Integer taxRateBps;
    private Long taxInr;
    private Long discountInr = 0L;
    private Long totalInr;
    @Valid private Customer customer;
    private String orderStatus = "awaiting_payment";
    private String paymentStatus = "pending";
    @JsonIgnore @Indexed private String accessTokenHash;
    @JsonIgnore @Indexed(unique = true, sparse = true) private String creationKeyHash;
    @JsonIgnore private String creationRequestHash;
    @JsonIgnore private String razorpayOrderId;
    @JsonIgnore private String razorpayPaymentId;
    @JsonIgnore private Long razorpayAmountPaise;
    @JsonIgnore private String paymentRequestKey;
    @JsonIgnore private Instant paymentLockUntil;
    @JsonIgnore private List<String> processedWebhookIds = new ArrayList<>();
    private String invoiceNumber;
    private String invoiceType;
    @Valid private InvoiceSnapshot invoiceSnapshot;
    @Version private Long version;
    @CreatedDate private Instant createdAt;
    @LastModifiedDate private Instant updatedAt;

    public static class Item {
        private String componentId;
        private String name;
        private String brand;
        private String model;
        private String category;
        private Integer quantity = 1;
        private Long unitPriceInr;
        private Long lineTotalInr;
        public String getComponentId() { return componentId; }
        public void setComponentId(String v) { componentId = v; }
        public String getName() { return name; }
        public void setName(String v) { name = v; }
        public String getBrand() { return brand; }
        public void setBrand(String v) { brand = v; }
        public String getModel() { return model; }
        public void setModel(String v) { model = v; }
        public String getCategory() { return category; }
        public void setCategory(String v) { category = v; }
        public Integer getQuantity() { return quantity; }
        public void setQuantity(Integer v) { quantity = v; }
        public Long getUnitPriceInr() { return unitPriceInr; }
        public void setUnitPriceInr(Long v) { unitPriceInr = v; }
        public Long getLineTotalInr() { return lineTotalInr; }
        public void setLineTotalInr(Long v) { lineTotalInr = v; }
    }

    public static class Customer {
        private String name;
        private String email;
        private String phone;
        private String address;
        public String getName() { return name; }
        public void setName(String v) { name = v; }
        public String getEmail() { return email; }
        public void setEmail(String v) { email = v; }
        public String getPhone() { return phone; }
        public void setPhone(String v) { phone = v; }
        public String getAddress() { return address; }
        public void setAddress(String v) { address = v; }
    }

    public static class InvoiceSnapshot {
        private String sellerName;
        private String sellerAddress;
        private String sellerGstin;
        private String customerName;
        private String customerEmail;
        private String customerPhone;
        private String customerAddress;
        private List<Item> items = new ArrayList<>();
        private Long subtotalInr;
        private Long taxInr;
        private Long discountInr;
        private Long totalInr;
        private Integer taxRateBps;
        private Instant issuedAt;
        public String getSellerName() { return sellerName; }
        public void setSellerName(String v) { sellerName = v; }
        public String getSellerAddress() { return sellerAddress; }
        public void setSellerAddress(String v) { sellerAddress = v; }
        public String getSellerGstin() { return sellerGstin; }
        public void setSellerGstin(String v) { sellerGstin = v; }
        public String getCustomerName() { return customerName; }
        public void setCustomerName(String v) { customerName = v; }
        public String getCustomerEmail() { return customerEmail; }
        public void setCustomerEmail(String v) { customerEmail = v; }
        public String getCustomerPhone() { return customerPhone; }
        public void setCustomerPhone(String v) { customerPhone = v; }
        public String getCustomerAddress() { return customerAddress; }
        public void setCustomerAddress(String v) { customerAddress = v; }
        public List<Item> getItems() { return items; }
        public void setItems(List<Item> v) { items = v; }
        public Long getSubtotalInr() { return subtotalInr; }
        public void setSubtotalInr(Long v) { subtotalInr = v; }
        public Long getTaxInr() { return taxInr; }
        public void setTaxInr(Long v) { taxInr = v; }
        public Long getDiscountInr() { return discountInr; }
        public void setDiscountInr(Long v) { discountInr = v; }
        public Long getTotalInr() { return totalInr; }
        public void setTotalInr(Long v) { totalInr = v; }
        public Integer getTaxRateBps() { return taxRateBps; }
        public void setTaxRateBps(Integer v) { taxRateBps = v; }
        public Instant getIssuedAt() { return issuedAt; }
        public void setIssuedAt(Instant v) { issuedAt = v; }
    }

    public String getId() { return id; }
    public void setId(String v) { id = v; }
    public String getOrderNumber() { return orderNumber; }
    public void setOrderNumber(String v) { orderNumber = v; }
    public String getBuild() { return build; }
    public void setBuild(String v) { build = v; }
    public List<Item> getItems() { return items; }
    public void setItems(List<Item> v) { items = v; }
    public Long getSubtotalInr() { return subtotalInr; }
    public void setSubtotalInr(Long v) { subtotalInr = v; }
    public Integer getTaxRateBps() { return taxRateBps; }
    public void setTaxRateBps(Integer v) { taxRateBps = v; }
    public Long getTaxInr() { return taxInr; }
    public void setTaxInr(Long v) { taxInr = v; }
    public Long getDiscountInr() { return discountInr; }
    public void setDiscountInr(Long v) { discountInr = v; }
    public Long getTotalInr() { return totalInr; }
    public void setTotalInr(Long v) { totalInr = v; }
    public Customer getCustomer() { return customer; }
    public void setCustomer(Customer v) { customer = v; }
    public String getOrderStatus() { return orderStatus; }
    public void setOrderStatus(String v) { orderStatus = v; }
    public String getPaymentStatus() { return paymentStatus; }
    public void setPaymentStatus(String v) { paymentStatus = v; }
    public String getAccessTokenHash() { return accessTokenHash; }
    public void setAccessTokenHash(String v) { accessTokenHash = v; }
    public String getCreationKeyHash() { return creationKeyHash; }
    public void setCreationKeyHash(String v) { creationKeyHash = v; }
    public String getCreationRequestHash() { return creationRequestHash; }
    public void setCreationRequestHash(String v) { creationRequestHash = v; }
    public String getRazorpayOrderId() { return razorpayOrderId; }
    public void setRazorpayOrderId(String v) { razorpayOrderId = v; }
    public String getRazorpayPaymentId() { return razorpayPaymentId; }
    public void setRazorpayPaymentId(String v) { razorpayPaymentId = v; }
    public Long getRazorpayAmountPaise() { return razorpayAmountPaise; }
    public void setRazorpayAmountPaise(Long v) { razorpayAmountPaise = v; }
    public String getPaymentRequestKey() { return paymentRequestKey; }
    public void setPaymentRequestKey(String v) { paymentRequestKey = v; }
    public Instant getPaymentLockUntil() { return paymentLockUntil; }
    public void setPaymentLockUntil(Instant v) { paymentLockUntil = v; }
    public List<String> getProcessedWebhookIds() { return processedWebhookIds; }
    public void setProcessedWebhookIds(List<String> v) { processedWebhookIds = v; }
    public String getInvoiceNumber() { return invoiceNumber; }
    public void setInvoiceNumber(String v) { invoiceNumber = v; }
    public String getInvoiceType() { return invoiceType; }
    public void setInvoiceType(String v) { invoiceType = v; }
    public InvoiceSnapshot getInvoiceSnapshot() { return invoiceSnapshot; }
    public void setInvoiceSnapshot(InvoiceSnapshot v) { invoiceSnapshot = v; }
    public Long getVersion() { return version; }
    public void setVersion(Long v) { version = v; }
    public Instant getCreatedAt() { return createdAt; }
    public void setCreatedAt(Instant v) { createdAt = v; }
    public Instant getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(Instant v) { updatedAt = v; }
}
