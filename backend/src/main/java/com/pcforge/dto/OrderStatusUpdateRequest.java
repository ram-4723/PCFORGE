package com.pcforge.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;

public record OrderStatusUpdateRequest(
    @NotBlank(message = "Status cannot be blank")
    @Pattern(
        regexp = "^(awaiting_payment|paid|processing|assembling|tested|shipped|delivered|cancelled)$",
        message = "Invalid status. Must be one of: awaiting_payment, paid, processing, assembling, tested, shipped, delivered, cancelled"
    )
    String status
) {}
