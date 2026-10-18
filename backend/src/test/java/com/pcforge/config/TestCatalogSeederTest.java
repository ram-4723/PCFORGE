package com.pcforge.config;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

import com.pcforge.models.Component;
import com.pcforge.repositories.ComponentRepository;
import com.pcforge.repositories.PCBuildRepository;
import com.pcforge.services.BuildService;
import com.pcforge.services.CompatibilityService;
import com.pcforge.services.TestCatalogueGuard;
import java.util.HashSet;
import org.junit.jupiter.api.Test;

class TestCatalogSeederTest {
    @Test void testInventoryIsExplicitlyInStockDemoDataWithStableUniqueKeys() {
        var products = TestCatalogSeeder.testProducts();
        assertEquals(26, products.size());
        assertTrue(products.stream().allMatch(item -> item.isActive() && item.isDemoData()
                && "in_stock".equals(item.getStockStatus()) && item.getPriceInr() > 0
                && item.getTestCatalogKey() != null && item.getSpecifications().containsKey("testCatalog")));
        assertEquals(products.size(), new HashSet<>(products.stream().map(Component::getTestCatalogKey).toList()).size());
        assertTrue(products.stream().anyMatch(item -> "Processors (CPU)".equals(item.getCategory())));
        assertTrue(products.stream().anyMatch(item -> "PC Cabinets and Cases".equals(item.getCategory())));
        for (String category : java.util.List.of("Processors (CPU)", "Motherboards", "RAM", "SSDs and HDDs",
                "Power Supplies", "PC Cabinets and Cases", "Graphics Cards (GPU)", "CPU Coolers")) {
            assertTrue(products.stream().filter(item -> category.equals(item.getCategory())).count() >= 3,
                    "Expected several choices in " + category);
        }
        assertTrue(products.stream().filter(item -> "Power Supplies".equals(item.getCategory()))
                .allMatch(item -> String.valueOf(item.getSpecifications().get("connectors")).contains("8-pin EPS")));
    }

    @Test void disabledTestGatePreventsAnyCatalogueWrites() {
        ComponentRepository repository = mock(ComponentRepository.class);
        TestCatalogueGuard guard = mock(TestCatalogueGuard.class);
        when(guard.isEnabled()).thenReturn(false);
        var seeder = new TestCatalogSeeder(repository, guard);
        assertThrows(IllegalStateException.class, () -> seeder.run(null));
        verifyNoInteractions(repository);
    }

    @Test void seededCatalogueSupportsDifferentCompatibleGamingBuildsAcrossBudgets() {
        ComponentRepository repository = mock(ComponentRepository.class);
        TestCatalogueGuard guard = mock(TestCatalogueGuard.class);
        when(guard.isEnabled()).thenReturn(true);
        when(repository.findAll()).thenReturn(TestCatalogSeeder.testProducts());
        var builder = new BuildService(repository, mock(PCBuildRepository.class), new CompatibilityService(), guard);

        var entryBuild = builder.recommend(30_000, "gaming", "balanced");
        var midBuild = builder.recommend(40_000, "gaming", "balanced");
        var upperBuild = builder.recommend(50_000, "gaming", "balanced");

        assertEquals(29_300, entryBuild.totalInr());
        assertEquals(38_300, midBuild.totalInr());
        assertEquals(48_300, upperBuild.totalInr());
        assertTrue(java.util.stream.Stream.of(entryBuild, midBuild, upperBuild).allMatch(build ->
                build.components().stream().allMatch(item -> "in_stock".equals(item.getStockStatus()))
                        && build.components().stream().anyMatch(item -> "Graphics Cards (GPU)".equals(item.getCategory()))
                        && !"incompatible".equals(build.compatibility().status()) && build.testCheckoutEnabled()));
        assertEquals("TEST-GTX1650-4G", entryBuild.components().stream().filter(item -> "Graphics Cards (GPU)".equals(item.getCategory())).findFirst().orElseThrow().getModel());
        assertEquals("TEST-RTX3050-8G", midBuild.components().stream().filter(item -> "Graphics Cards (GPU)".equals(item.getCategory())).findFirst().orElseThrow().getModel());
        assertEquals("TEST-DUAL-RTX4060-O8G", upperBuild.components().stream().filter(item -> "Graphics Cards (GPU)".equals(item.getCategory())).findFirst().orElseThrow().getModel());
    }
}
