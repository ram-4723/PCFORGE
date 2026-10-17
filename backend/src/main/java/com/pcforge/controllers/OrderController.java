package com.pcforge.controllers;

import com.pcforge.dto.ApiResponse;
import com.pcforge.dto.OrderCreateRequest;
import com.pcforge.dto.PaymentVerifyRequest;
import com.pcforge.dto.PaymentFailedRequest;
import com.pcforge.models.Order;
import com.pcforge.services.InvoiceService;
import com.pcforge.services.OrderService;
import com.pcforge.services.PaymentService;
import jakarta.validation.Valid;
import java.util.Map;
import org.springframework.http.ContentDisposition;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/orders")
@Validated
public class OrderController {
    private final OrderService orders;
    private final PaymentService payments;
    private final InvoiceService invoices;
    public OrderController(OrderService orders, PaymentService payments, InvoiceService invoices) {
        this.orders = orders; this.payments = payments; this.invoices = invoices;
    }

    @PostMapping
    public ApiResponse<Map<String, Object>> create(@Valid @RequestBody OrderCreateRequest request,
            @RequestHeader(value = "X-Build-Session", required = false) String buildToken,
            @RequestHeader(value = "Idempotency-Key", required = false) String idempotencyKey) {
        OrderService.Created created = orders.create(request, buildToken, idempotencyKey);
        return ApiResponse.of(Map.of("order", created.order(), "accessToken", created.accessToken()));
    }

    @GetMapping("/{id}")
    public ApiResponse<Map<String, Order>> get(@PathVariable String id,
            @RequestHeader(value = "X-Order-Access", required = false) String token) {
        return ApiResponse.of(Map.of("order", orders.get(id, token)));
    }

    @PostMapping("/{id}/payments")
    public ApiResponse<Map<String, PaymentService.Checkout>> checkout(@PathVariable String id,
            @RequestHeader(value = "X-Order-Access", required = false) String token,
            @RequestHeader(value = "Idempotency-Key", required = false) String idempotencyKey) {
        return ApiResponse.of(Map.of("checkout", payments.createCheckout(id, token, idempotencyKey)));
    }

    @PostMapping("/{id}/payments/verify")
    public ResponseEntity<ApiResponse<Map<String, Object>>> verify(@PathVariable String id,
            @RequestHeader(value = "X-Order-Access", required = false) String token,
            @Valid @RequestBody PaymentVerifyRequest request) {
        PaymentService.Verified result = payments.verify(id, token, request);
        HttpStatus status = "pending".equals(result.result()) ? HttpStatus.ACCEPTED : HttpStatus.OK;
        return ResponseEntity.status(status).body(ApiResponse.of(Map.of("order", result.order(), "paymentStatus", result.result())));
    }

    @PostMapping("/{id}/payments/fail")
    public ApiResponse<Map<String, Object>> fail(@PathVariable String id,
            @RequestHeader(value = "X-Order-Access", required = false) String token,
            @Valid @RequestBody PaymentFailedRequest request) {
        PaymentService.Verified result = payments.fail(id, token, request);
        return ApiResponse.of(Map.of("order", result.order(), "paymentStatus", result.result()));
    }

    @GetMapping(value = "/{id}/invoice", produces = MediaType.APPLICATION_PDF_VALUE)
    public ResponseEntity<byte[]> invoice(@PathVariable String id,
            @RequestHeader(value = "X-Order-Access", required = false) String token) {
        Order order = orders.get(id, token);
        if ("paid".equals(order.getPaymentStatus())) order = invoices.issueForPaidOrder(id);
        byte[] pdf = invoices.render(order);
        String filename = (order.getInvoiceNumber() == null ? "estimate-" + order.getOrderNumber() : order.getInvoiceNumber()) + ".pdf";
        return ResponseEntity.ok().contentType(MediaType.APPLICATION_PDF)
                .header(HttpHeaders.CONTENT_DISPOSITION, ContentDisposition.attachment().filename(filename).build().toString())
                .body(pdf);
    }
}
