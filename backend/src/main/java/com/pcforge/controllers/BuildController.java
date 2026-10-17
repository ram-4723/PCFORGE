package com.pcforge.controllers;

import com.pcforge.dto.ApiResponse;
import com.pcforge.dto.BuildRequest;
import com.pcforge.models.PCBuild;
import com.pcforge.services.BuildService;
import com.pcforge.services.CompatibilityService;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.Size;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/builds")
@Validated
public class BuildController {
    private final BuildService service;
    public BuildController(BuildService service) { this.service = service; }

    public record CheckRequest(@jakarta.validation.constraints.NotEmpty @Size(max=12) List<@Pattern(regexp="[a-fA-F0-9]{24}") String> componentIds) { }
    public record RecommendationRequest(@Positive long budgetInr, @NotBlank @Pattern(regexp="gaming|programming|video_editing|office|3d_rendering") String intendedUse,
            @NotBlank @Pattern(regexp="balanced|gaming_performance|upgrade_friendly|budget_focused") String preference) { }

    @PostMapping("/compatibility")
    public ApiResponse<Map<String, CompatibilityService.Result>> compatibility(@Valid @RequestBody CheckRequest request) {
        return ApiResponse.of(Map.of("compatibility", service.check(request.componentIds())));
    }

    @PostMapping("/recommendations")
    public ApiResponse<Map<String, BuildService.Suggestion>> recommend(@Valid @RequestBody RecommendationRequest request) {
        return ApiResponse.of(Map.of("recommendation", service.recommend(request.budgetInr(), request.intendedUse(), request.preference())));
    }

    @PostMapping
    public ApiResponse<Map<String, Object>> create(@Valid @RequestBody BuildRequest request) {
        BuildService.Saved saved = service.save(request);
        return ApiResponse.of(Map.of("build", saved.build(), "sessionToken", saved.sessionToken()));
    }

    @GetMapping("/{id}")
    public ApiResponse<Map<String, PCBuild>> get(@PathVariable String id, @RequestHeader(value="X-Build-Session", required=false) String token) {
        return ApiResponse.of(Map.of("build", service.get(id, token)));
    }

    @PutMapping("/{id}")
    public ApiResponse<Map<String, PCBuild>> update(@PathVariable String id, @RequestHeader(value="X-Build-Session", required=false) String token, @Valid @RequestBody BuildRequest request) {
        return ApiResponse.of(Map.of("build", service.update(id, token, request)));
    }

    @DeleteMapping("/{id}")
    public ApiResponse<Map<String, Boolean>> delete(@PathVariable String id, @RequestHeader(value="X-Build-Session", required=false) String token) {
        service.delete(id, token); return ApiResponse.of(Map.of("deleted", true));
    }
}
