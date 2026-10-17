package com.pcforge.services;

import com.pcforge.exception.ApiException;
import com.pcforge.models.Order;
import com.pcforge.repositories.OrderRepository;
import java.io.ByteArrayOutputStream;
import java.time.Instant;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;
import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.pdmodel.PDPage;
import org.apache.pdfbox.pdmodel.PDPageContentStream;
import org.apache.pdfbox.pdmodel.common.PDRectangle;
import org.apache.pdfbox.pdmodel.font.PDType1Font;
import org.apache.pdfbox.pdmodel.font.Standard14Fonts;
import org.springframework.dao.DuplicateKeyException;
import org.springframework.data.mongodb.core.FindAndModifyOptions;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.data.mongodb.core.query.Query;
import org.springframework.data.mongodb.core.query.Update;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;

@Service
public class InvoiceService {
    private final MongoTemplate mongo;
    private final OrderRepository orders;
    private final InvoiceConfiguration config;
    private static final DateTimeFormatter YEAR = DateTimeFormatter.ofPattern("yyyy").withZone(ZoneId.of("Asia/Kolkata"));
    private static final DateTimeFormatter DATE = DateTimeFormatter.ofPattern("dd MMM yyyy, hh:mm a z").withLocale(Locale.ENGLISH).withZone(ZoneId.of("Asia/Kolkata"));

    public InvoiceService(MongoTemplate mongo, OrderRepository orders, InvoiceConfiguration config) {
        this.mongo = mongo; this.orders = orders; this.config = config;
    }

    public Order issueForPaidOrder(String id) {
        Order order = orders.findById(id).orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "ORDER_NOT_FOUND", "Order not found."));
        if (!"paid".equals(order.getPaymentStatus())) throw new ApiException(HttpStatus.CONFLICT, "PAYMENT_NOT_CONFIRMED", "An invoice is available after payment is confirmed.");
        if (order.getInvoiceNumber() != null && order.getInvoiceSnapshot() != null) return order;
        Instant now = Instant.now();
        boolean taxInvoice = config.canIssueTaxInvoice(order.getTaxRateBps() == null ? 0 : order.getTaxRateBps());
        String prefix = taxInvoice ? "INV" : "RCPT";
        String number = nextNumber(prefix, now);
        Order.InvoiceSnapshot snapshot = snapshot(order, now);
        order.setInvoiceNumber(number);
        order.setInvoiceType(taxInvoice ? "TAX_INVOICE" : "PAYMENT_RECEIPT");
        order.setInvoiceSnapshot(snapshot);
        try { return orders.save(order); }
        catch (org.springframework.dao.OptimisticLockingFailureException duplicateIssue) {
            return orders.findById(id).filter(o -> o.getInvoiceNumber() != null).orElseThrow(() -> duplicateIssue);
        }
    }

    public byte[] render(Order order) {
        boolean paid = "paid".equals(order.getPaymentStatus());
        Order.InvoiceSnapshot invoice = paid ? order.getInvoiceSnapshot() : null;
        try (PDDocument document = new PDDocument(); ByteArrayOutputStream output = new ByteArrayOutputStream()) {
            List<String> lines = new ArrayList<>();
            String title = invoice == null ? "ORDER ESTIMATE" : ("TAX_INVOICE".equals(order.getInvoiceType()) ? "TAX INVOICE" : "PAYMENT RECEIPT");
            lines.add(title);
            lines.add(invoice == null ? "Estimate reference: " + order.getOrderNumber() : "Invoice number: " + order.getInvoiceNumber());
            lines.add("Date: " + DATE.format(invoice == null ? order.getCreatedAt() == null ? Instant.now() : order.getCreatedAt() : invoice.getIssuedAt()));
            lines.add("Order: " + order.getOrderNumber());
            lines.add("");
            String sellerName = invoice == null ? config.sellerName() : invoice.getSellerName();
            String sellerAddress = invoice == null ? config.sellerAddress() : invoice.getSellerAddress();
            String sellerGstin = invoice == null ? config.sellerGstin() : invoice.getSellerGstin();
            if (!sellerName.isBlank()) lines.add("Seller: " + sellerName);
            if (!sellerAddress.isBlank()) lines.add("Seller address: " + sellerAddress);
            if (!sellerGstin.isBlank()) lines.add("GSTIN: " + sellerGstin);
            Order.Customer customer = order.getCustomer();
            lines.add("Customer: " + customer.getName());
            lines.add("Email: " + customer.getEmail());
            lines.add("Phone: " + customer.getPhone());
            lines.add("Address: " + customer.getAddress());
            lines.add("");
            lines.add("ITEM                                      QTY      UNIT PRICE       AMOUNT");
            lines.add("--------------------------------------------------------------------------");
            List<Order.Item> items = invoice == null ? order.getItems() : invoice.getItems();
            for (Order.Item item : items) {
                lines.addAll(wrap(item.getName() + " · " + item.getBrand() + " " + item.getModel(), 43));
                lines.add("                                          " + item.getQuantity() + "      " + money(item.getUnitPriceInr()) + "      " + money(item.getLineTotalInr()));
            }
            lines.add("--------------------------------------------------------------------------");
            lines.add("Subtotal: " + money(invoice == null ? order.getSubtotalInr() : invoice.getSubtotalInr()));
            lines.add("Tax (" + (invoice == null ? order.getTaxRateBps() : invoice.getTaxRateBps()) / 100.0 + "%): " + money(invoice == null ? order.getTaxInr() : invoice.getTaxInr()));
            lines.add("Discount: " + money(invoice == null ? order.getDiscountInr() : invoice.getDiscountInr()));
            lines.add("TOTAL: " + money(invoice == null ? order.getTotalInr() : invoice.getTotalInr()));
            lines.add("");
            if (invoice == null) lines.add("Estimate only. This document is not a tax invoice or proof of payment.");
            else if (!"TAX_INVOICE".equals(order.getInvoiceType())) lines.add("Payment receipt only. Not a GST tax invoice; seller tax details are not fully configured.");
            else lines.add("Amounts are in INR. Tax settings were supplied by the seller.");
            lines.add("Payment status: " + order.getPaymentStatus().toUpperCase(Locale.ROOT));
            writeLines(document, lines);
            document.save(output);
            return output.toByteArray();
        } catch (Exception e) {
            throw new ApiException(HttpStatus.INTERNAL_SERVER_ERROR, "INVOICE_GENERATION_FAILED", "The invoice PDF could not be generated.");
        }
    }

    private String nextNumber(String prefix, Instant now) {
        String year = YEAR.format(now);
        String key = prefix + "-" + year;
        Query query = Query.query(Criteria.where("_id").is(key));
        Update update = new Update().inc("value", 1);
        FindAndModifyOptions options = FindAndModifyOptions.options().upsert(true).returnNew(true);
        Counter counter;
        try { counter = mongo.findAndModify(query, update, options, Counter.class); }
        catch (DuplicateKeyException concurrentFirstUse) { counter = mongo.findAndModify(query, update, FindAndModifyOptions.options().returnNew(true), Counter.class); }
        return prefix + "-" + year + "-" + String.format(Locale.ROOT, "%06d", counter.value);
    }

    private Order.InvoiceSnapshot snapshot(Order order, Instant issuedAt) {
        Order.InvoiceSnapshot value = new Order.InvoiceSnapshot();
        value.setSellerName(config.sellerName()); value.setSellerAddress(config.sellerAddress()); value.setSellerGstin(config.sellerGstin());
        value.setCustomerName(order.getCustomer().getName()); value.setCustomerEmail(order.getCustomer().getEmail());
        value.setCustomerPhone(order.getCustomer().getPhone()); value.setCustomerAddress(order.getCustomer().getAddress());
        value.setItems(order.getItems().stream().map(this::copy).toList());
        value.setSubtotalInr(order.getSubtotalInr()); value.setTaxInr(order.getTaxInr()); value.setDiscountInr(order.getDiscountInr());
        value.setTotalInr(order.getTotalInr()); value.setTaxRateBps(order.getTaxRateBps()); value.setIssuedAt(issuedAt);
        return value;
    }
    private Order.Item copy(Order.Item original) {
        Order.Item copy = new Order.Item(); copy.setComponentId(original.getComponentId()); copy.setName(original.getName());
        copy.setBrand(original.getBrand()); copy.setModel(original.getModel()); copy.setCategory(original.getCategory());
        copy.setQuantity(original.getQuantity()); copy.setUnitPriceInr(original.getUnitPriceInr()); copy.setLineTotalInr(original.getLineTotalInr()); return copy;
    }
    private static String money(Long amount) { return "INR " + java.text.NumberFormat.getNumberInstance(new Locale("en", "IN")).format(amount == null ? 0 : amount); }
    private static List<String> wrap(String line, int width) {
        if (line.length() <= width) return List.of(line);
        List<String> out = new ArrayList<>();
        for (int start = 0; start < line.length(); start += width) out.add(line.substring(start, Math.min(start + width, line.length())));
        return out;
    }
    private static void writeLines(PDDocument document, List<String> lines) throws java.io.IOException {
        PDType1Font regular = new PDType1Font(Standard14Fonts.FontName.HELVETICA);
        PDType1Font bold = new PDType1Font(Standard14Fonts.FontName.HELVETICA_BOLD);
        PDPage page = new PDPage(PDRectangle.A4); document.addPage(page);
        PDPageContentStream content = new PDPageContentStream(document, page);
        float y = page.getMediaBox().getHeight() - 52;
        for (int i = 0; i < lines.size(); i++) {
            if (y < 52) { content.close(); page = new PDPage(PDRectangle.A4); document.addPage(page); content = new PDPageContentStream(document, page); y = page.getMediaBox().getHeight() - 52; }
            content.beginText(); content.setFont(i == 0 || lines.get(i).startsWith("TOTAL:") ? bold : regular, i == 0 ? 17 : 9);
            content.newLineAtOffset(48, y); content.showText(lines.get(i).replaceAll("[^\\x20-\\x7E]", " ")); content.endText(); y -= i == 0 ? 28 : 16;
        }
        content.close();
    }
    public static class Counter { @org.springframework.data.annotation.Id public String id; public Long value; }
}
