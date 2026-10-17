package com.pcforge.models;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import jakarta.validation.constraints.PositiveOrZero;
import java.time.Instant;
import java.util.List;
import java.util.ArrayList;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.Id;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

@Document(collection = "pc_builds")
public class PCBuild {
    @Id
    private String id;

    @NotEmpty
    @Indexed
    private List<@Pattern(regexp = "[a-fA-F0-9]{24}") String> selectedComponents;

    @NotBlank
    @Pattern(regexp = "gaming|programming|video_editing|office|3d_rendering")
    @Size(max = 40)
    private String intendedUse;

    @NotBlank
    @Pattern(regexp = "balanced|gaming_performance|upgrade_friendly|budget_focused")
    private String preference = "balanced";

    @NotNull
    @PositiveOrZero
    private Long budgetInr;

    @NotNull
    @PositiveOrZero
    private Long calculatedTotalInr;

    @NotBlank
    @Pattern(regexp = "saved")
    private String status = "saved";

    /** Hash only; the session capability is returned once when a saved build is created. */
    @com.fasterxml.jackson.annotation.JsonIgnore
    @Indexed
    private String sessionTokenHash;

    private List<ItemSnapshot> itemSnapshots = new ArrayList<>();

    public static class ItemSnapshot {
        private String componentId;
        private String name;
        private String category;
        private Long priceInr;
        private java.util.Map<String, Object> specifications;
        public String getComponentId() { return componentId; }
        public void setComponentId(String v) { componentId = v; }
        public String getName() { return name; }
        public void setName(String v) { name = v; }
        public String getCategory() { return category; }
        public void setCategory(String v) { category = v; }
        public Long getPriceInr() { return priceInr; }
        public void setPriceInr(Long v) { priceInr = v; }
        public java.util.Map<String, Object> getSpecifications() { return specifications; }
        public void setSpecifications(java.util.Map<String, Object> v) { specifications = v; }
    }

    @CreatedDate
    private Instant createdAt;

    @LastModifiedDate
    private Instant updatedAt;

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }
    public List<String> getSelectedComponents() { return selectedComponents; }
    public void setSelectedComponents(List<String> selectedComponents) { this.selectedComponents = selectedComponents; }
    public String getIntendedUse() { return intendedUse; }
    public void setIntendedUse(String intendedUse) { this.intendedUse = intendedUse; }
    public String getPreference() { return preference; }
    public void setPreference(String v) { preference = v; }
    public Long getBudgetInr() { return budgetInr; }
    public void setBudgetInr(Long budgetInr) { this.budgetInr = budgetInr; }
    public Long getCalculatedTotalInr() { return calculatedTotalInr; }
    public void setCalculatedTotalInr(Long calculatedTotalInr) { this.calculatedTotalInr = calculatedTotalInr; }
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
    public String getSessionTokenHash() { return sessionTokenHash; }
    public void setSessionTokenHash(String v) { sessionTokenHash = v; }
    public List<ItemSnapshot> getItemSnapshots() { return itemSnapshots; }
    public void setItemSnapshots(List<ItemSnapshot> v) { itemSnapshots = v; }
    public Instant getCreatedAt() { return createdAt; }
    public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }
    public Instant getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(Instant updatedAt) { this.updatedAt = updatedAt; }
}
