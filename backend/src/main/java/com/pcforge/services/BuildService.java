package com.pcforge.services;

import com.pcforge.dto.BuildRequest;
import com.pcforge.exception.ApiException;
import com.pcforge.models.Component;
import com.pcforge.models.PCBuild;
import com.pcforge.repositories.ComponentRepository;
import com.pcforge.repositories.PCBuildRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.SecureRandom;
import java.util.*;

@Service
public class BuildService {
    private final ComponentRepository components;
    private final PCBuildRepository builds;
    private final CompatibilityService compatibility;
    private final TestCatalogueGuard testCatalogueGuard;
    private final SecureRandom secureRandom = new SecureRandom();

    public BuildService(ComponentRepository components, PCBuildRepository builds, CompatibilityService compatibility, TestCatalogueGuard testCatalogueGuard) {
        this.components = components; this.builds = builds; this.compatibility = compatibility; this.testCatalogueGuard = testCatalogueGuard;
    }

    public record Saved(PCBuild build, String sessionToken) { }
    public record Suggestion(List<Component> components, long totalInr, long budgetInr, CompatibilityService.Result compatibility, String explanation, boolean demoData, boolean testCheckoutEnabled, boolean paymentsEnabled) { }

    public CompatibilityService.Result check(List<String> ids) { return compatibility.check(resolve(ids)); }

    public Saved save(BuildRequest request) {
        List<Component> selected = resolve(request.componentIds());
        long total = total(selected);
        if (total > request.budgetInr()) throw new ApiException(HttpStatus.BAD_REQUEST, "BUDGET_EXCEEDED", "Selected components exceed the submitted budget.");
        String token = token();
        PCBuild build = new PCBuild();
        build.setSelectedComponents(selected.stream().map(Component::getId).toList());
        build.setIntendedUse(request.intendedUse()); build.setPreference(request.preference()); build.setBudgetInr(request.budgetInr()); build.setCalculatedTotalInr(total);
        build.setItemSnapshots(snapshot(selected)); build.setSessionTokenHash(hash(token));
        return new Saved(builds.save(build), token);
    }

    public PCBuild get(String id, String token) {
        PCBuild build = owned(id, token);
        try {
            List<Component> current = resolve(build.getSelectedComponents());
            build.setItemSnapshots(snapshot(current));
            build.setCalculatedTotalInr(total(current));
            return builds.save(build);
        } catch (ApiException unavailable) {
            // Keep the saved snapshot readable when catalog items are later deactivated.
            return build;
        }
    }

    public PCBuild update(String id, String token, BuildRequest request) {
        PCBuild build = owned(id, token);
        List<Component> selected = resolve(request.componentIds());
        long total = total(selected);
        if (total > request.budgetInr()) throw new ApiException(HttpStatus.BAD_REQUEST, "BUDGET_EXCEEDED", "Selected components exceed the submitted budget.");
        build.setSelectedComponents(selected.stream().map(Component::getId).toList()); build.setItemSnapshots(snapshot(selected));
        build.setIntendedUse(request.intendedUse()); build.setPreference(request.preference()); build.setBudgetInr(request.budgetInr()); build.setCalculatedTotalInr(total);
        return builds.save(build);
    }

    public void delete(String id, String token) { builds.delete(owned(id, token)); }

    public Suggestion recommend(long budget, String use, String preference) {
        if (budget <= 0 || budget > 1_000_000_000L) throw new ApiException(HttpStatus.BAD_REQUEST, "INVALID_BUDGET", "budgetInr must be a positive integer no greater than 1,000,000,000.");
        List<Component> all = components.findAll().stream().filter(Component::isActive)
                .filter(c -> !c.isDemoData() || testCatalogueGuard.isEnabled())
                .filter(c -> "in_stock".equals(c.getStockStatus()))
                .filter(c -> c.getPriceInr() != null && c.getPriceInr() > 0)
                .sorted(Comparator.comparing(Component::getPriceInr).thenComparing(Component::getId)).toList();
        Map<String, List<Component>> by = new HashMap<>();
        for (Component c : all) { String key = CompatibilityService.category(c.getCategory()); if (key != null) by.computeIfAbsent(key, ignored -> new ArrayList<>()).add(c); }
        List<String> required = List.of("cpu", "motherboard", "ram", "storage", "psu", "case");
        for (String category : required) if (!by.containsKey(category)) throw new ApiException(HttpStatus.NOT_FOUND, "INSUFFICIENT_CATALOG", "No active, in-stock " + category + " products are available for a recommendation.");
        List<Component> chosen = findBaseBuild(required, by, budget);
        if (chosen == null) throw new ApiException(HttpStatus.UNPROCESSABLE_ENTITY, "NO_RECOMMENDATION", "Available active catalog data does not support a compatible required build within this budget.");
        // The search result is immutable; later optional GPU selection may add an item.
        chosen = new ArrayList<>(chosen);
        long total = total(chosen);
        if ("upgrade_friendly".equals(preference) && by.containsKey("motherboard")) {
            Component upgradeBoard = by.get("motherboard").stream().filter(c -> Boolean.TRUE.equals(c.getSpecifications() == null ? null : c.getSpecifications().get("upgradeFriendly"))).findFirst().orElse(null);
            if (upgradeBoard != null && safeAdd(total - chosen.get(1).getPriceInr(), upgradeBoard.getPriceInr()) <= budget) {
                total = safeAdd(total - chosen.get(1).getPriceInr(), upgradeBoard.getPriceInr()); chosen.set(1, upgradeBoard);
            }
        }
        boolean graphicsWorkload = Set.of("gaming", "video_editing", "3d_rendering").contains(use);
        if ((graphicsWorkload || "gaming_performance".equals(preference)) && by.containsKey("gpu")) {
            long coreTotal = total;
            var gpuChoices = by.get("gpu").stream()
                    .filter(c -> safeAdd(coreTotal, c.getPriceInr()) <= budget)
                    .sorted("budget_focused".equals(preference)
                            ? Comparator.comparing(Component::getPriceInr).thenComparing(Component::getId)
                            : Comparator.comparing(Component::getPriceInr).reversed().thenComparing(Component::getId))
                    .toList();
            Component gpu = null;
            for (Component candidate : gpuChoices) {
                List<Component> withGpu = new ArrayList<>(chosen);
                withGpu.add(candidate);
                if (!"incompatible".equals(compatibility.check(withGpu).status())) {
                    gpu = candidate;
                    break;
                }
            }
            if (gpu != null) { chosen.add(gpu); total = safeAdd(total, gpu.getPriceInr()); }
        }
        CompatibilityService.Result result = compatibility.check(chosen);
        if (total > budget || "incompatible".equals(result.status())) throw new ApiException(HttpStatus.UNPROCESSABLE_ENTITY, "NO_RECOMMENDATION", "Available active catalog data does not support a recommendation within this budget and compatibility constraints.");
        String strategy = "budget_focused".equals(preference) ? "Selected lowest-priced in-stock products." : "Selected in-stock products using the requested preference where catalog fields allow it.";
        boolean demoData = chosen.stream().anyMatch(Component::isDemoData);
        return new Suggestion(List.copyOf(chosen), total, budget, result, strategy + " Compatibility remains subject to the listed structured data and warnings.", demoData,
                demoData && testCatalogueGuard.isEnabled(), testCatalogueGuard.paymentsEnabled());
    }

    private List<Component> findBaseBuild(List<String> required, Map<String, List<Component>> by, long budget) {
        return searchBase(required, by, budget, 0, new ArrayList<>(), 0);
    }

    private List<Component> searchBase(List<String> required, Map<String, List<Component>> by, long budget,
                                       int index, List<Component> current, long total) {
        if (index == required.size()) {
            return "incompatible".equals(compatibility.check(current).status()) ? null : List.copyOf(current);
        }
        List<Component> options = by.get(required.get(index)).stream().limit(12).toList();
        for (Component candidate : options) {
            long next;
            try { next = safeAdd(total, candidate.getPriceInr()); } catch (ArithmeticException overflow) { continue; }
            if (next > budget) continue;
            current.add(candidate);
            List<Component> match = searchBase(required, by, budget, index + 1, current, next);
            current.removeLast();
            if (match != null) return match;
        }
        return null;
    }

    private PCBuild owned(String id, String rawToken) {
        if (id == null || !id.matches("[a-fA-F0-9]{24}")) throw new ApiException(HttpStatus.BAD_REQUEST, "INVALID_ID", "Build ID must be a 24-character MongoDB ObjectId.");
        if (rawToken == null || rawToken.length() < 32 || rawToken.length() > 128) throw new ApiException(HttpStatus.NOT_FOUND, "BUILD_NOT_FOUND", "Saved build not found.");
        return builds.findByIdAndSessionTokenHash(id, hash(rawToken)).orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "BUILD_NOT_FOUND", "Saved build not found."));
    }
    private List<Component> resolve(List<String> ids) {
        if (ids == null || ids.isEmpty() || ids.size() > 12) throw new ApiException(HttpStatus.BAD_REQUEST, "INVALID_COMPONENTS", "Select between 1 and 12 components.");
        if (new HashSet<>(ids).size() != ids.size()) throw new ApiException(HttpStatus.BAD_REQUEST, "DUPLICATE_COMPONENT", "A component can only be selected once.");
        List<Component> found = java.util.stream.StreamSupport.stream(components.findAllById(ids).spliterator(), false)
                .filter(Component::isActive)
                .filter(component -> !component.isDemoData() || testCatalogueGuard.isEnabled()).toList();
        if (found.size() != ids.size()) throw new ApiException(HttpStatus.BAD_REQUEST, "INVALID_COMPONENTS", "One or more selected components are unavailable.");
        return found;
    }
    private static List<PCBuild.ItemSnapshot> snapshot(List<Component> components) {
        return components.stream().map(c -> { var i = new PCBuild.ItemSnapshot(); i.setComponentId(c.getId()); i.setName(c.getName()); i.setCategory(c.getCategory()); i.setPriceInr(c.getPriceInr()); i.setSpecifications(c.getSpecifications()); return i; }).toList();
    }
    private static long total(List<Component> parts) { long value = 0; for (Component c : parts) value = safeAdd(value, c.getPriceInr() == null ? 0 : c.getPriceInr()); return value; }
    private static long safeAdd(long a, long b) { return Math.addExact(a, b); }
    private String token() { byte[] bytes = new byte[32]; secureRandom.nextBytes(bytes); return Base64.getUrlEncoder().withoutPadding().encodeToString(bytes); }
    private static String hash(String token) { try { return HexFormat.of().formatHex(MessageDigest.getInstance("SHA-256").digest(token.getBytes(StandardCharsets.UTF_8))); } catch (Exception e) { throw new IllegalStateException(e); } }
}
