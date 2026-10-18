package com.pcforge.repositories;

import com.pcforge.models.UserAccount;
import java.util.Optional;
import org.springframework.data.mongodb.repository.MongoRepository;

public interface UserAccountRepository extends MongoRepository<UserAccount, String> {
    Optional<UserAccount> findByEmail(String email);
    boolean existsByRole(String role);
}
