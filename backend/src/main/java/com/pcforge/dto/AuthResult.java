package com.pcforge.dto;

import java.time.Instant;

public record AuthResult(String accessToken, Instant expiresAt, PublicUser user) { }
