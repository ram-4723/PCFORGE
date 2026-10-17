package com.pcforge.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import java.util.List;

public record BuildRequest(
        @NotEmpty @Size(max = 12) List<@Pattern(regexp = "[a-fA-F0-9]{24}") String> componentIds,
        @NotBlank @Pattern(regexp = "gaming|programming|video_editing|office|3d_rendering") String intendedUse,
        @NotBlank @Pattern(regexp = "balanced|gaming_performance|upgrade_friendly|budget_focused") String preference,
        @NotNull @Positive Long budgetInr) { }
