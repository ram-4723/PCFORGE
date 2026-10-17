package com.pcforge.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;

public record PaymentVerifyRequest(
        @NotBlank @Pattern(regexp = "pay_[A-Za-z0-9]+") String razorpayPaymentId,
        @NotBlank @Pattern(regexp = "[A-Fa-f0-9]{64}") String razorpaySignature) { }
