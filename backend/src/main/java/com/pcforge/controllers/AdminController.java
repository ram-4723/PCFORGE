package com.pcforge.controllers;

import com.pcforge.dto.AdminOverviewStats;
import com.pcforge.dto.ApiResponse;
import com.pcforge.dto.OrderStatusUpdateRequest;
import com.pcforge.models.Order;
import com.pcforge.services.AdminService;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import java.util.Map;
import org.springframework.http.ContentDisposition;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/admin")
@Validated
public class AdminController {
    private final AdminService admin;
    public AdminController(AdminService admin) { this.admin = admin; }

    @GetMapping("/overview")
    public ApiResponse<AdminOverviewStats> overview(@RequestHeader(value = "Authorization", required = false) String authorization) {
        return ApiResponse.of(admin.overview(authorization));
    }

    @GetMapping("/orders")
    public ApiResponse<Map<String, Object>> orders(
            @RequestHeader(value = "Authorization", required = false) String authorization,
            @RequestParam(defaultValue = "1") @Min(1) int page,
            @RequestParam(defaultValue = "15") @Min(1) @Max(100) int size,
            @RequestParam(required = false) String search,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String paymentStatus) {
        AdminService.OrderPage result = admin.orders(authorization, page, size, search, status, paymentStatus);
        return ApiResponse.of(Map.of("orders", result.orders(), "pagination", result.pagination()));
    }

    @GetMapping("/orders/{id}")
    public ApiResponse<Map<String, Order>> getOrder(
            @PathVariable String id,
            @RequestHeader(value = "Authorization", required = false) String authorization) {
        return ApiResponse.of(Map.of("order", admin.getOrder(authorization, id)));
    }

    @PatchMapping("/orders/{id}/status")
    public ApiResponse<Map<String, Order>> updateOrderStatus(
            @PathVariable String id,
            @Valid @RequestBody OrderStatusUpdateRequest request,
            @RequestHeader(value = "Authorization", required = false) String authorization) {
        return ApiResponse.of(Map.of("order", admin.updateOrderStatus(authorization, id, request.status())));
    }

    @GetMapping(value = "/orders/{id}/invoice", produces = MediaType.APPLICATION_PDF_VALUE)
    public ResponseEntity<byte[]> getOrderInvoice(
            @PathVariable String id,
            @RequestHeader(value = "Authorization", required = false) String authorization) {
        byte[] pdf = admin.getOrderInvoicePdf(authorization, id);
        return ResponseEntity.ok()
                .contentType(MediaType.APPLICATION_PDF)
                .header(HttpHeaders.CONTENT_DISPOSITION, ContentDisposition.attachment().filename("admin-order-" + id + ".pdf").build().toString())
                .body(pdf);
    }

    @PostMapping("/orders/seed")
    public ApiResponse<Map<String, Object>> seedDemoOrders(
            @RequestHeader(value = "Authorization", required = false) String authorization) {
        return ApiResponse.of(admin.seedDemoOrders(authorization));
    }

    @GetMapping("/users")
    public ApiResponse<Map<String, Object>> users(
            @RequestHeader(value = "Authorization", required = false) String authorization,
            @RequestParam(defaultValue = "1") @Min(1) int page,
            @RequestParam(defaultValue = "20") @Min(1) @Max(100) int size,
            @RequestParam(required = false) String search) {
        AdminService.UserPage result = admin.users(authorization, page, size, search);
        return ApiResponse.of(Map.of("users", result.users(), "pagination", result.pagination()));
    }
}
