package com.pcforge.models;

import java.time.Instant;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

@Document("auth_sessions")
public class AuthSession {
    @Id private String id;
    @Indexed(unique = true) private String tokenHash;
    @Indexed private String userId;
    @Indexed(expireAfter = "0s") private Instant expiresAt;

    public String getId() { return id; }
    public void setId(String value) { id = value; }
    public String getTokenHash() { return tokenHash; }
    public void setTokenHash(String value) { tokenHash = value; }
    public String getUserId() { return userId; }
    public void setUserId(String value) { userId = value; }
    public Instant getExpiresAt() { return expiresAt; }
    public void setExpiresAt(Instant value) { expiresAt = value; }
}
