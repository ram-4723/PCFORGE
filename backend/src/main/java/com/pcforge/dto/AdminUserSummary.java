package com.pcforge.dto;

import com.pcforge.models.UserAccount;
import java.time.Instant;

public record AdminUserSummary(String name, String email, Instant registeredAt) {
    public static AdminUserSummary from(UserAccount account) {
        return new AdminUserSummary(account.getName(), account.getEmail(), account.getRegisteredAt());
    }
}
