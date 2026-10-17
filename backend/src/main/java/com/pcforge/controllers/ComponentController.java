package com.pcforge.controllers;

import com.pcforge.dto.ApiResponse;
import com.pcforge.dto.Pagination;
import com.pcforge.models.Component;
import com.pcforge.services.ComponentService;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import org.springframework.data.domain.Page;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/components")
@Validated
public class ComponentController {
    private final ComponentService service;
    public ComponentController(ComponentService service) { this.service = service; }
    @GetMapping
    public ApiResponse<Map<String, List<Component>>> list(@RequestParam(required=false) String category,
            @RequestParam(required=false) String brand,
            @RequestParam(required=false) Long minPrice,
            @RequestParam(required=false) Long maxPrice,
            @RequestParam(required=false) String search,
            @RequestParam(defaultValue="1") @Min(1) int page,
            @RequestParam(defaultValue="20") @Min(1) @Max(100) int limit,
            @RequestParam(defaultValue="name") String sort) {
        Page<Component> result = service.list(category, brand, minPrice, maxPrice, search, page, limit, sort);
        return ApiResponse.page(Map.of("components", result.getContent()), new Pagination(page, limit, result.getTotalElements(), result.getTotalPages()));
    }
    @GetMapping("/{id}")
    public ApiResponse<Map<String, Component>> get(@PathVariable String id) { return ApiResponse.of(Map.of("component", service.getActive(id))); }
}
