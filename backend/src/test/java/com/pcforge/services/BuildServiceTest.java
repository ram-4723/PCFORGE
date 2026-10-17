package com.pcforge.services;

import com.pcforge.dto.BuildRequest;
import com.pcforge.models.Component;
import com.pcforge.models.PCBuild;
import com.pcforge.repositories.ComponentRepository;
import com.pcforge.repositories.PCBuildRepository;
import org.junit.jupiter.api.Test;
import java.util.List;
import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

class BuildServiceTest {
    private final ComponentRepository components = mock(ComponentRepository.class);
    private final PCBuildRepository builds = mock(PCBuildRepository.class);
    private final BuildService service = new BuildService(components, builds, new CompatibilityService(), mock(TestCatalogueGuard.class));

    @Test void savesServerPricedSnapshotAndReturnsOneTimeCapability() {
        Component cpu = new Component(); cpu.setId("012345678901234567890123"); cpu.setName("Processor"); cpu.setCategory("CPU"); cpu.setPriceInr(14500L); cpu.setActive(true);
        when(components.findAllById(List.of(cpu.getId()))).thenReturn(List.of(cpu));
        when(builds.save(any(PCBuild.class))).thenAnswer(invocation -> invocation.getArgument(0));

        BuildService.Saved saved = service.save(new BuildRequest(List.of(cpu.getId()), "programming", "balanced", 20000L));

        assertEquals(14500L, saved.build().getCalculatedTotalInr());
        assertEquals(14500L, saved.build().getItemSnapshots().getFirst().getPriceInr());
        assertEquals(43, saved.sessionToken().length());
        assertNotEquals(saved.sessionToken(), saved.build().getSessionTokenHash());
    }

    @Test void recommendsGraphicsForThreeDimensionalWorkloadsWhenAffordable() {
        List<Component> catalog = List.of(
                component("100000000000000000000001", "CPU", 10000),
                component("100000000000000000000002", "Motherboard", 8000),
                component("100000000000000000000003", "RAM", 4000),
                component("100000000000000000000004", "Storage", 3000),
                component("100000000000000000000005", "PSU", 4000),
                component("100000000000000000000006", "Case", 3000),
                component("100000000000000000000007", "GPU", 12000));
        when(components.findAll()).thenReturn(catalog);

        BuildService.Suggestion suggestion = service.recommend(60000, "3d_rendering", "balanced");

        assertTrue(suggestion.components().stream().anyMatch(item -> "GPU".equals(item.getCategory())));
        assertTrue(suggestion.totalInr() <= suggestion.budgetInr());
    }

    @Test void excludesOutOfStockProductsFromRecommendations() {
        List<Component> catalog = List.of(
                component("200000000000000000000001", "CPU", 10000),
                component("200000000000000000000002", "Motherboard", 8000),
                component("200000000000000000000003", "RAM", 4000),
                component("200000000000000000000004", "Storage", 3000),
                component("200000000000000000000005", "PSU", 4000),
                component("200000000000000000000006", "Case", 3000),
                unavailableComponent("200000000000000000000007", "GPU", 12000));
        when(components.findAll()).thenReturn(catalog);

        BuildService.Suggestion suggestion = service.recommend(60000, "gaming", "balanced");

        assertFalse(suggestion.components().stream().anyMatch(item -> "GPU".equals(item.getCategory())));
        assertTrue(suggestion.components().stream().allMatch(item -> "in_stock".equals(item.getStockStatus())));
    }

    @Test void hidesInStockTestProductsUnlessTestCatalogueGateIsEnabled() {
        List<Component> catalog = List.of(
                demoComponent("300000000000000000000001", "CPU", 10000),
                demoComponent("300000000000000000000002", "Motherboard", 8000),
                demoComponent("300000000000000000000003", "RAM", 4000),
                demoComponent("300000000000000000000004", "Storage", 3000),
                demoComponent("300000000000000000000005", "PSU", 4000),
                demoComponent("300000000000000000000006", "Case", 3000));
        when(components.findAll()).thenReturn(catalog);
        assertEquals("INSUFFICIENT_CATALOG", assertThrows(com.pcforge.exception.ApiException.class,
                () -> service.recommend(60000, "programming", "balanced")).getCode());
    }

    private static Component component(String id, String category, long price) {
        Component component = new Component();
        component.setId(id); component.setName(category); component.setCategory(category);
        component.setBrand("Demo test fixture"); component.setPriceInr(price); component.setActive(true);
        component.setStockStatus("in_stock");
        return component;
    }

    private static Component unavailableComponent(String id, String category, long price) {
        Component component = component(id, category, price);
        component.setStockStatus("out_of_stock");
        return component;
    }
    private static Component demoComponent(String id, String category, long price) {
        Component component = component(id, category, price); component.setDemoData(true); component.setTestCatalogKey("test:" + id); return component;
    }
}
