package com.pcforge.config;

import com.pcforge.models.Component;
import com.pcforge.repositories.ComponentRepository;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;

import java.util.List;
import java.util.stream.StreamSupport;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

class DemoCatalogSeederTest {
    private final ComponentRepository repository = mock(ComponentRepository.class);

    @Test void seedsThirtySevenDemoProductsWhenCollectionIsEmpty() {
        when(repository.findAll()).thenReturn(List.of());
        var seeder = new DemoCatalogSeeder(repository);

        seeder.run(null);

        ArgumentCaptor<Iterable<Component>> captor = ArgumentCaptor.forClass(Iterable.class);
        verify(repository).saveAll(captor.capture());
        List<Component> seeded = StreamSupport.stream(captor.getValue().spliterator(), false).toList();
        assertEquals(37, seeded.size());
        assertTrue(seeded.stream().allMatch(item -> item.isActive() && item.isDemoData() && "out_of_stock".equals(item.getStockStatus())));
        assertTrue(seeded.stream().noneMatch(item -> item.getBrand() != null && item.getBrand().startsWith("Demo ")));
        assertTrue(seeded.stream().anyMatch(item -> item.getBrand() == null), "Unknown sample manufacturers stay unknown.");
        assertTrue(seeded.stream().anyMatch(item -> "Processors (CPU)".equals(item.getCategory()) && item.getPriceInr() == 6500L));
        assertTrue(seeded.stream().anyMatch(item -> "Graphics Cards (GPU)".equals(item.getCategory()) && item.getPriceInr() == 350000L));
    }

    @Test void leavesNonEmptyCatalogUntouched() {
        var realProduct = new Component(); realProduct.setName("Verified inventory"); realProduct.setCategory("CPU");
        when(repository.findAll()).thenReturn(List.of(realProduct));
        var seeder = new DemoCatalogSeeder(repository);

        seeder.run(null);

        verify(repository, never()).saveAll(any());
    }

    @Test void addsMissingDemoRecordsWithoutDuplicatingExistingDemoEntries() {
        var existing = DemoCatalogSeeder.demoComponents().subList(0, 7);
        when(repository.findAll()).thenReturn(existing);
        var seeder = new DemoCatalogSeeder(repository);

        seeder.run(null);

        ArgumentCaptor<Iterable<Component>> captor = ArgumentCaptor.forClass(Iterable.class);
        verify(repository).saveAll(captor.capture());
        assertEquals(30, StreamSupport.stream(captor.getValue().spliterator(), false).count());
    }
}
