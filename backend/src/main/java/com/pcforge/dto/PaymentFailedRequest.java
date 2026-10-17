package com.pcforge.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;

public record PaymentFailedRequest(
        @NotBlank @Pattern(regexp = "pay_[A-Za-z0-9]+") String razorpayPaymentId) { }
