package com.pcforge.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public record OrderCreateRequest(
        @NotBlank @Pattern(regexp = "[a-fA-F0-9]{24}") String buildId,
        @NotNull @Valid Customer customer) {
    public record Customer(
            @NotBlank @Size(max = 120) String name,
            @NotBlank @Email @Size(max = 254) String email,
            @NotBlank @Size(max = 32) @Pattern(regexp = "[0-9+() .-]{8,32}") String phone,
            @NotBlank @Size(max = 500) String address) { }
}
