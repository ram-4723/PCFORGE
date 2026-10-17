package com.pcforge.models;

import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.AssertTrue;
import jakarta.validation.constraints.PositiveOrZero;
import jakarta.validation.constraints.Size;
import jakarta.validation.constraints.Pattern;
import java.time.Instant;
import java.util.Map;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.Id;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.mongodb.core.index.CompoundIndex;
import org.springframework.data.mongodb.core.index.TextIndexed;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

@Document(collection = "components")
@CompoundIndex(name = "active_category_name", def = "{'active': 1, 'category': 1, 'name': 1}")
public class Component {
    @Id
    @JsonProperty("_id")
    private String id;

    @NotBlank
    @Size(max = 160)
    @TextIndexed
    private String name;

    @NotBlank
    @Size(max = 80)
    private String category;

    @Size(max = 100)
    @TextIndexed
    private String brand;

    @NotBlank
    @Size(max = 120)
    @TextIndexed
    private String model;

    @NotNull
    @PositiveOrZero
    private Long priceInr;

    /** Structured, category-specific attributes (e.g. socket, memoryType, formFactor). */
    private Map<String, Object> specifications = Map.of();

    @Size(max = 2048)
    private String imageUrl;

    @NotBlank
    @Pattern(regexp = "in_stock|out_of_stock|preorder|discontinued")
    private String stockStatus = "out_of_stock";

    private boolean active;

    /** True only for explicitly seeded local sample records; never represents saleable stock. */
    private boolean demoData;

    /** Stable key for records owned by the isolated local payment-test catalogue. */
    @Indexed(unique = true, sparse = true)
    private String testCatalogKey;

    @CreatedDate
    private Instant createdAt;

    @LastModifiedDate
    private Instant updatedAt;

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    public String getCategory() { return category; }
    public void setCategory(String category) { this.category = category; }
    public String getBrand() { return brand; }
    public void setBrand(String brand) { this.brand = brand == null || brand.isBlank() ? null : brand.trim(); }
    public String getModel() { return model; }
    public void setModel(String model) { this.model = model; }
    public Long getPriceInr() { return priceInr; }
    public void setPriceInr(Long priceInr) { this.priceInr = priceInr; }
    public Map<String, Object> getSpecifications() { return specifications; }
    public void setSpecifications(Map<String, Object> specifications) { this.specifications = specifications; }
    @AssertTrue(message = "Specifications must be a flat object with short keys and scalar values.")
    public boolean isSpecificationsWellFormed() {
        if (specifications == null) return true;
        return specifications.entrySet().stream().allMatch(entry -> entry.getKey() != null
                && entry.getKey().matches("[A-Za-z][A-Za-z0-9]{0,49}")
                && (entry.getValue() == null || entry.getValue() instanceof String text && text.length() <= 256
                    || entry.getValue() instanceof Number || entry.getValue() instanceof Boolean));
    }
    public String getImageUrl() { return imageUrl; }
    public void setImageUrl(String imageUrl) { this.imageUrl = imageUrl; }
    public String getStockStatus() { return stockStatus; }
    public void setStockStatus(String stockStatus) { this.stockStatus = stockStatus; }
    public boolean isActive() { return active; }
    public void setActive(boolean active) { this.active = active; }
    public boolean isDemoData() { return demoData; }
    public void setDemoData(boolean demoData) { this.demoData = demoData; }
    public String getTestCatalogKey() { return testCatalogKey; }
    public void setTestCatalogKey(String testCatalogKey) { this.testCatalogKey = testCatalogKey; }
    public Instant getCreatedAt() { return createdAt; }
    public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }
    public Instant getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(Instant updatedAt) { this.updatedAt = updatedAt; }
}
