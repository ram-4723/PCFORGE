package com.pcforge.models;

import com.fasterxml.jackson.annotation.JsonIgnore;
import java.time.Instant;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

@Document("users")
public class UserAccount {
    @Id private String id;
    private String name;
    @Indexed(unique = true) private String email;
    @JsonIgnore private String passwordHash;
    private String role;
    private Instant registeredAt;

    public String getId() { return id; }
    public void setId(String value) { id = value; }
    public String getName() { return name; }
    public void setName(String value) { name = value; }
    public String getEmail() { return email; }
    public void setEmail(String value) { email = value; }
    public String getPasswordHash() { return passwordHash; }
    public void setPasswordHash(String value) { passwordHash = value; }
    public String getRole() { return role; }
    public void setRole(String value) { role = value; }
    public Instant getRegisteredAt() { return registeredAt; }
    public void setRegisteredAt(Instant value) { registeredAt = value; }
}
