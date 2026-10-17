package com.pcforge.controllers;

import com.pcforge.dto.ApiResponse;
import com.pcforge.services.PaymentService;
import java.util.Map;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/payments")
public class PaymentWebhookController {
    private final PaymentService payments;
    public PaymentWebhookController(PaymentService payments) { this.payments = payments; }

    @PostMapping(value = "/webhook", consumes = MediaType.APPLICATION_JSON_VALUE)
    public ApiResponse<Map<String, String>> webhook(@RequestBody byte[] rawBody,
            @RequestHeader(value = "X-Razorpay-Signature", required = false) String signature,
            @RequestHeader(value = "X-Razorpay-Event-Id", required = false) String eventId) {
        return ApiResponse.of(Map.of("result", payments.handleWebhook(rawBody, signature, eventId)));
    }
}
