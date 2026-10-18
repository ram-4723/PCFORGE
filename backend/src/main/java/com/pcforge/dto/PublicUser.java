package com.pcforge.dto;

import com.pcforge.models.UserAccount;
import java.time.Instant;

public record PublicUser(String id, String name, String email, String role, Instant registeredAt) {
    public static PublicUser from(UserAccount account) {
        return new PublicUser(account.getId(), account.getName(), account.getEmail(), account.getRole(), account.getRegisteredAt());
    }
}
