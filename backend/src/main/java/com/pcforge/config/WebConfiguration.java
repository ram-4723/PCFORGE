package com.pcforge.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.InterceptorRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

@Configuration
public class WebConfiguration implements WebMvcConfigurer {
    private final SensitiveEndpointRateLimiter limiter;
    public WebConfiguration(SensitiveEndpointRateLimiter limiter) { this.limiter = limiter; }
    @Override public void addInterceptors(InterceptorRegistry registry) {
        registry.addInterceptor(limiter).addPathPatterns("/api/orders/**", "/api/auth/login", "/api/auth/register");
    }
}
