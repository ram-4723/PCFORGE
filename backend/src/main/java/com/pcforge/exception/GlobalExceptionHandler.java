package com.pcforge.exception;

import com.pcforge.dto.ErrorResponse;
import jakarta.validation.ConstraintViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.dao.DataAccessException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.method.annotation.MethodArgumentTypeMismatchException;
import java.util.LinkedHashMap;
import java.util.Map;

@RestControllerAdvice
public class GlobalExceptionHandler {
    @ExceptionHandler(ApiException.class)
    ResponseEntity<ErrorResponse> api(ApiException e) { return ResponseEntity.status(e.getStatus()).body(new ErrorResponse(false, new ErrorResponse.ErrorBody(e.getCode(), e.getMessage(), null))); }
    @ExceptionHandler({ConstraintViolationException.class, MethodArgumentNotValidException.class, MethodArgumentTypeMismatchException.class})
    ResponseEntity<ErrorResponse> validation(Exception e) {
        Map<String,String> details = new LinkedHashMap<>();
        if (e instanceof ConstraintViolationException c) c.getConstraintViolations().forEach(v -> details.put(v.getPropertyPath().toString(), v.getMessage()));
        if (e instanceof MethodArgumentNotValidException m) m.getBindingResult().getFieldErrors().forEach(v -> details.put(v.getField(), v.getDefaultMessage()));
        return ResponseEntity.badRequest().body(new ErrorResponse(false, new ErrorResponse.ErrorBody("VALIDATION_ERROR", "Request validation failed.", details.isEmpty() ? null : details)));
    }
    @ExceptionHandler(Exception.class)
    ResponseEntity<ErrorResponse> unexpected(Exception e) { return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(new ErrorResponse(false, new ErrorResponse.ErrorBody("INTERNAL_SERVER_ERROR", "An unexpected error occurred.", null))); }

    @ExceptionHandler(DataAccessException.class)
    ResponseEntity<ErrorResponse> database(DataAccessException e) { return ResponseEntity.status(HttpStatus.SERVICE_UNAVAILABLE).body(new ErrorResponse(false, new ErrorResponse.ErrorBody("DATABASE_UNAVAILABLE", "The database is not available.", null))); }
}
