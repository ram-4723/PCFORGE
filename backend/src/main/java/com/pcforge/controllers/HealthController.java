package com.pcforge.controllers;

import com.pcforge.dto.ApiResponse;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import java.util.Map;

@RestController
@RequestMapping("/api/health")
public class HealthController {
    private final MongoTemplate mongo;
    public HealthController(MongoTemplate mongo) { this.mongo = mongo; }
    @GetMapping
    public ResponseEntity<ApiResponse<Map<String, String>>> health() {
        try {
            mongo.executeCommand(new org.bson.Document("ping", 1));
            return ResponseEntity.ok(ApiResponse.of(Map.of("status", "ok", "database", "connected")));
        } catch (RuntimeException exception) {
            return ResponseEntity.status(HttpStatus.SERVICE_UNAVAILABLE).body(new ApiResponse<>(false, Map.of("status", "degraded", "database", "disconnected"), null));
        }
    }
}
