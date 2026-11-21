package com.pcforge.dto;

import java.util.Map;

public record AdminOverviewStats(
    long totalRegisteredUsers,
    long totalOrders,
    long totalRevenueInr,
    long averageOrderValueInr,
    Map<String, Long> ordersByStatus,
    Map<String, Long> paymentsByStatus
) {}
