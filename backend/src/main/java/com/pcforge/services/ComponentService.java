package com.pcforge.services;

import com.pcforge.exception.ApiException;
import com.pcforge.models.Component;
import com.pcforge.repositories.ComponentRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.data.mongodb.core.query.Query;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.beans.factory.annotation.Autowired;
import java.util.Set;

@Service
public class ComponentService {
    private static final Set<String> CATEGORIES = Set.of("CPU", "GPU", "Motherboard", "RAM", "Storage", "PSU", "Case", "CPU Cooler", "Monitor", "Keyboard", "Mouse", "Other Peripherals", "Processors (CPU)", "Graphics Cards (GPU)", "Motherboards", "SSDs and HDDs", "Power Supplies", "PC Cabinets and Cases", "CPU Coolers", "Case Fans", "Monitors", "Keyboards", "Gaming Mice", "Gaming Chairs", "Headphones and Speakers", "Gaming Controllers", "Mousepads", "Networking Devices", "Other PC Accessories");
    private final ComponentRepository repository;
    private final MongoTemplate mongoTemplate;
    private final TestCatalogueGuard testCatalogueGuard;
    public ComponentService(ComponentRepository repository) { this.repository = repository; this.mongoTemplate = null; this.testCatalogueGuard = null; }
    @Autowired
    public ComponentService(ComponentRepository repository, MongoTemplate mongoTemplate, TestCatalogueGuard testCatalogueGuard) { this.repository = repository; this.mongoTemplate = mongoTemplate; this.testCatalogueGuard = testCatalogueGuard; }
    public Page<Component> list(String category, int page, int limit) {
        return list(category, null, null, null, null, page, limit, "name");
    }
    public Page<Component> list(String category, String brand, Long minPrice, Long maxPrice, String search, int page, int limit, String sort) {
        if (page < 1 || limit < 1 || limit > 100) throw new ApiException(HttpStatus.BAD_REQUEST, "VALIDATION_ERROR", "page must be >= 1 and limit must be between 1 and 100.");
        if (category != null && !category.isBlank() && CATEGORIES.stream().noneMatch(c -> c.equalsIgnoreCase(category.trim())))
            throw new ApiException(HttpStatus.BAD_REQUEST, "INVALID_CATEGORY", "The requested category is not supported.");
        if (minPrice != null && minPrice < 0 || maxPrice != null && maxPrice < 0 || minPrice != null && maxPrice != null && minPrice > maxPrice)
            throw new ApiException(HttpStatus.BAD_REQUEST, "INVALID_PRICE_RANGE", "Price filters must be non-negative and minPrice cannot exceed maxPrice.");
        String sortField = switch (sort == null ? "name" : sort) {
            case "priceAsc" -> "priceInr"; case "priceDesc" -> "priceInr"; case "name", "createdAt" -> sort == null ? "name" : sort;
            default -> throw new ApiException(HttpStatus.BAD_REQUEST, "INVALID_SORT", "sort must be name, priceAsc, priceDesc, or createdAt.");
        };
        Sort.Direction direction = "priceDesc".equals(sort) ? Sort.Direction.DESC : Sort.Direction.ASC;
        var pageable = PageRequest.of(page - 1, limit, Sort.by(direction, sortField).and(Sort.by(Sort.Order.asc("id"))));
        if (mongoTemplate == null) return testCatalogueEnabled()
            ? (category == null || category.isBlank() ? repository.findByActiveTrue(pageable) : repository.findByActiveTrueAndCategoryIgnoreCase(category.trim(), pageable))
            : (category == null || category.isBlank() ? repository.findPublicActive(pageable) : repository.findPublicActiveByCategory("^" + java.util.regex.Pattern.quote(category.trim()) + "$", pageable));
        var criteria = new java.util.ArrayList<Criteria>();
        criteria.add(Criteria.where("active").is(true));
        if (!testCatalogueEnabled()) criteria.add(Criteria.where("demoData").ne(true));
        if (category != null && !category.isBlank()) criteria.add(Criteria.where("category").regex("^" + java.util.regex.Pattern.quote(category.trim()) + "$", "i"));
        if (brand != null && !brand.isBlank()) criteria.add(Criteria.where("brand").regex("^" + java.util.regex.Pattern.quote(brand.trim()) + "$", "i"));
        if (minPrice != null || maxPrice != null) {
            Criteria price = Criteria.where("priceInr");
            if (minPrice != null) price.gte(minPrice);
            if (maxPrice != null) price.lte(maxPrice);
            criteria.add(price);
        }
        if (search != null && !search.isBlank()) {
            if (search.length() > 100) throw new ApiException(HttpStatus.BAD_REQUEST, "INVALID_SEARCH", "search must be at most 100 characters.");
            String escaped = java.util.regex.Pattern.quote(search.trim());
            criteria.add(new Criteria().orOperator(Criteria.where("name").regex(escaped, "i"), Criteria.where("brand").regex(escaped, "i"), Criteria.where("model").regex(escaped, "i")));
        }
        Criteria combined = new Criteria().andOperator(criteria.toArray(Criteria[]::new));
        Query query = Query.query(combined).with(pageable);
        long count = mongoTemplate.count(Query.query(combined), Component.class);
        return new org.springframework.data.domain.PageImpl<>(mongoTemplate.find(query, Component.class), pageable, count);
    }
    public Component getActive(String id) {
        if (id == null || !id.matches("[a-fA-F0-9]{24}")) throw new ApiException(HttpStatus.BAD_REQUEST, "INVALID_ID", "Component ID must be a 24-character MongoDB ObjectId.");
        Component component = repository.findByIdAndActiveTrue(id).orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "COMPONENT_NOT_FOUND", "Component not found."));
        if (component.isDemoData() && !testCatalogueEnabled()) throw new ApiException(HttpStatus.NOT_FOUND, "COMPONENT_NOT_FOUND", "Component not found.");
        return component;
    }
    private boolean testCatalogueEnabled() { return testCatalogueGuard != null && testCatalogueGuard.isEnabled(); }
}
