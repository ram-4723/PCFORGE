package com.pcforge.controllers;

import com.pcforge.dto.ApiResponse;
import com.pcforge.services.AdminService;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import java.util.Map;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/admin")
@Validated
public class AdminController {
    private final AdminService admin;
    public AdminController(AdminService admin) { this.admin = admin; }

    @GetMapping("/overview")
    public ApiResponse<AdminService.Overview> overview(@RequestHeader(value = "Authorization", required = false) String authorization) {
        return ApiResponse.of(admin.overview(authorization));
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
