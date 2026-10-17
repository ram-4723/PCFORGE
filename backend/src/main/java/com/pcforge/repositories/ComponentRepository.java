package com.pcforge.repositories;

import com.pcforge.models.Component;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.data.mongodb.repository.Query;

public interface ComponentRepository extends MongoRepository<Component, String> {
    java.util.Optional<Component> findByTestCatalogKey(String testCatalogKey);
    Page<Component> findByActiveTrue(Pageable pageable);
    Page<Component> findByActiveTrueAndCategoryIgnoreCase(String category, Pageable pageable);
    @Query("{ 'active': true, 'demoData': { '$ne': true } }")
    Page<Component> findPublicActive(Pageable pageable);
    @Query("{ 'active': true, 'demoData': { '$ne': true }, 'category': { '$regex': ?0, '$options': 'i' } }")
    Page<Component> findPublicActiveByCategory(String categoryPattern, Pageable pageable);
    java.util.Optional<Component> findByIdAndActiveTrue(String id);
}
