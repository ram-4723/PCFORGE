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
        assertEquals(7, products.size());
        assertTrue(products.stream().allMatch(item -> item.isActive() && item.isDemoData()
                && "in_stock".equals(item.getStockStatus()) && item.getPriceInr() > 0
                && item.getTestCatalogKey() != null && item.getSpecifications().containsKey("testCatalog")));
        assertEquals(products.size(), new HashSet<>(products.stream().map(Component::getTestCatalogKey).toList()).size());
        assertTrue(products.stream().anyMatch(item -> "Processors (CPU)".equals(item.getCategory())));
        assertTrue(products.stream().anyMatch(item -> "PC Cabinets and Cases".equals(item.getCategory())));
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

    @Test void seededCatalogueSupportsBuilderRecommendationsAtTheDocumentedTestBudgets() {
        ComponentRepository repository = mock(ComponentRepository.class);
        TestCatalogueGuard guard = mock(TestCatalogueGuard.class);
        when(guard.isEnabled()).thenReturn(true);
        when(repository.findAll()).thenReturn(TestCatalogSeeder.testProducts());
        var builder = new BuildService(repository, mock(PCBuildRepository.class), new CompatibilityService(), guard);

        var integratedGraphics = builder.recommend(65_000, "gaming", "balanced");
        assertEquals(42_500, integratedGraphics.totalInr());
        assertTrue(integratedGraphics.components().stream().allMatch(item -> "in_stock".equals(item.getStockStatus())));
        assertTrue(integratedGraphics.components().stream().noneMatch(item -> "Graphics Cards (GPU)".equals(item.getCategory())));
        assertTrue(integratedGraphics.testCheckoutEnabled());

        var withGpu = builder.recommend(75_000, "gaming", "balanced");
        assertEquals(72_400, withGpu.totalInr());
        assertTrue(withGpu.components().stream().anyMatch(item -> "Graphics Cards (GPU)".equals(item.getCategory())));
        assertNotEquals("incompatible", withGpu.compatibility().status());
    }
}
