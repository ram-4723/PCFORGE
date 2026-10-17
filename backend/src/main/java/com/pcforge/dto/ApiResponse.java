package com.pcforge.dto;

import com.fasterxml.jackson.annotation.JsonInclude;

@JsonInclude(JsonInclude.Include.NON_NULL)
public record ApiResponse<T>(boolean success, T data, Object pagination) {
    public static <T> ApiResponse<T> of(T data) { return new ApiResponse<>(true, data, null); }
    public static <T> ApiResponse<T> page(T data, Object pagination) { return new ApiResponse<>(true, data, pagination); }
}
