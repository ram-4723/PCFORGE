package com.pcforge.repositories;

import com.pcforge.models.Order;
import java.util.Optional;
import org.springframework.data.mongodb.repository.MongoRepository;

public interface OrderRepository extends MongoRepository<Order, String> {
    Optional<Order> findByIdAndAccessTokenHash(String id, String accessTokenHash);
    Optional<Order> findByRazorpayOrderId(String razorpayOrderId);
    Optional<Order> findByCreationKeyHash(String creationKeyHash);
}
