package com.pcforge.controllers;

import com.pcforge.dto.ApiResponse;
import com.pcforge.dto.AuthResult;
import com.pcforge.dto.LoginRequest;
import com.pcforge.dto.PublicUser;
import com.pcforge.dto.RegisterRequest;
import com.pcforge.models.UserAccount;
import com.pcforge.services.AuthService;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
public class AuthController {
    private final AuthService auth;
    public AuthController(AuthService auth) { this.auth = auth; }

    @PostMapping("/register")
    public ApiResponse<AuthResult> register(@Valid @RequestBody RegisterRequest request) { return ApiResponse.of(auth.register(request)); }

    @PostMapping("/login")
    public ApiResponse<AuthResult> login(@Valid @RequestBody LoginRequest request) { return ApiResponse.of(auth.login(request)); }

    @GetMapping("/me")
    public ApiResponse<PublicUser> me(@RequestHeader(value = "Authorization", required = false) String authorization) {
        UserAccount user = auth.requireUser(authorization);
        return ApiResponse.of(PublicUser.from(user));
    }

    @PostMapping("/logout")
    public ApiResponse<Void> logout(@RequestHeader(value = "Authorization", required = false) String authorization) {
        auth.logout(authorization);
        return ApiResponse.of(null);
    }
}
