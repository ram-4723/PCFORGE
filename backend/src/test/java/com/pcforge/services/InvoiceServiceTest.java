package com.pcforge.services;

import static org.junit.jupiter.api.Assertions.*;
import com.pcforge.models.Order;
import java.io.ByteArrayInputStream;
import org.apache.pdfbox.Loader;
import org.apache.pdfbox.text.PDFTextStripper;
import org.junit.jupiter.api.Test;
import static org.mockito.Mockito.*;
import com.pcforge.repositories.OrderRepository;
import org.springframework.data.mongodb.core.FindAndModifyOptions;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.query.Query;
import org.springframework.data.mongodb.core.query.Update;

class InvoiceServiceTest {
    @Test void generatesEstimatePdfThatDoesNotClaimToBeATaxInvoice() throws Exception {
        InvoiceConfiguration config = new InvoiceConfiguration("PCForge Demo Seller", "Pune, Maharashtra", "");
        InvoiceService service = new InvoiceService(null, null, config);
        Order order = new Order();
        order.setOrderNumber("PF-ABC123"); order.setPaymentStatus("pending"); order.setSubtotalInr(12000L);
        order.setTaxRateBps(0); order.setTaxInr(0L); order.setDiscountInr(0L); order.setTotalInr(12000L);
        Order.Customer customer = new Order.Customer(); customer.setName("Test Customer"); customer.setEmail("test@example.com"); customer.setPhone("+91 9999999999"); customer.setAddress("Pune"); order.setCustomer(customer);
        Order.Item item = new Order.Item(); item.setName("Demo CPU"); item.setBrand("Example"); item.setModel("Sample"); item.setQuantity(1); item.setUnitPriceInr(12000L); item.setLineTotalInr(12000L); order.setItems(java.util.List.of(item));
        byte[] pdf = service.render(order);
        try (var document = Loader.loadPDF(pdf)) {
            String text = new PDFTextStripper().getText(document);
            assertTrue(text.contains("ORDER ESTIMATE"));
            assertTrue(text.contains("not a tax invoice"));
            assertTrue(text.contains("INR 12,000"));
        }
    }

    @Test void allocatesASequencedPaymentReceiptWhenTaxSellerConfigurationIsMissing() {
        MongoTemplate mongo = mock(MongoTemplate.class);
        OrderRepository orders = mock(OrderRepository.class);
        InvoiceConfiguration config = new InvoiceConfiguration("PCForge", "Pune", "");
        Order order = new Order(); order.setId("0123456789abcdef01234567"); order.setPaymentStatus("paid"); order.setOrderNumber("PF-ORDER");
        order.setItems(java.util.List.of()); order.setSubtotalInr(1000L); order.setTaxRateBps(0); order.setTaxInr(0L); order.setDiscountInr(0L); order.setTotalInr(1000L);
        Order.Customer customer = new Order.Customer(); customer.setName("Customer"); customer.setEmail("c@example.com"); customer.setPhone("9999999999"); customer.setAddress("Pune"); order.setCustomer(customer);
        when(orders.findById(order.getId())).thenReturn(java.util.Optional.of(order));
        when(mongo.findAndModify(any(Query.class), any(Update.class), any(FindAndModifyOptions.class), eq(InvoiceService.Counter.class)))
                .thenAnswer(call -> { var counter = new InvoiceService.Counter(); counter.value = 42L; return counter; });
        when(orders.save(any(Order.class))).thenAnswer(call -> call.getArgument(0));
        Order issued = new InvoiceService(mongo, orders, config).issueForPaidOrder(order.getId());
        assertTrue(issued.getInvoiceNumber().matches("RCPT-\\d{4}-000042"));
        assertEquals("PAYMENT_RECEIPT", issued.getInvoiceType());
        assertNotNull(issued.getInvoiceSnapshot().getIssuedAt());
    }
}
