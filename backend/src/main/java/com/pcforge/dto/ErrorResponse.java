package com.pcforge.dto;

import java.util.Map;

public record ErrorResponse(boolean success, ErrorBody error) {
    public record ErrorBody(String code, String message, Map<String, String> details) {}
}
