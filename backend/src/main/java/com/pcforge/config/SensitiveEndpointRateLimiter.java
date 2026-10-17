package com.pcforge.config;

import com.pcforge.exception.ApiException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.time.Instant;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.atomic.AtomicInteger;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;
import org.springframework.web.servlet.HandlerInterceptor;

@Component
public class SensitiveEndpointRateLimiter implements HandlerInterceptor {
    private static final int LIMIT = 20;
    private static final long WINDOW_SECONDS = 60;
    private final ConcurrentHashMap<String, Window> windows = new ConcurrentHashMap<>();
    private final AtomicInteger calls = new AtomicInteger();

    @Override public boolean preHandle(HttpServletRequest request, HttpServletResponse response, Object handler) {
        String path = request.getRequestURI();
        if (!path.startsWith("/api/orders") && !path.equals("/api/payments/webhook")) return true;
        String key = request.getRemoteAddr() == null ? "unknown" : request.getRemoteAddr();
        long now = Instant.now().getEpochSecond();
        if (calls.incrementAndGet() % 256 == 0) windows.entrySet().removeIf(entry -> now - entry.getValue().startedAt > WINDOW_SECONDS);
        if (windows.size() > 10_000 && !windows.containsKey(key)) throw new ApiException(HttpStatus.TOO_MANY_REQUESTS, "RATE_LIMITED", "Too many order requests. Try again shortly.");
        Window window = windows.compute(key, (ignored, current) -> current == null || now - current.startedAt >= WINDOW_SECONDS ? new Window(now, 1) : current.increment());
        if (window.count > LIMIT) {
            response.setHeader("Retry-After", Long.toString(WINDOW_SECONDS));
            throw new ApiException(HttpStatus.TOO_MANY_REQUESTS, "RATE_LIMITED", "Too many sensitive requests. Try again shortly.");
        }
        return true;
    }
    private record Window(long startedAt, int count) { Window increment() { return new Window(startedAt, count + 1); } }
}
