package com.pcforge.services;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;
import com.pcforge.dto.OrderCreateRequest;
import com.pcforge.exception.ApiException;
import com.pcforge.models.Component;
import com.pcforge.models.Order;
import com.pcforge.models.PCBuild;
import com.pcforge.repositories.ComponentRepository;
import com.pcforge.repositories.OrderRepository;
import com.pcforge.repositories.PCBuildRepository;
import java.util.List;
import java.util.Optional;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpStatus;

class OrderServiceTest {
    @Test void pricesOrderFromCurrentCatalogAndComputesTaxWithIntegerArithmetic() {
        PCBuildRepository builds = mock(PCBuildRepository.class);
        ComponentRepository components = mock(ComponentRepository.class);
        OrderRepository orders = mock(OrderRepository.class);
        String token = "A".repeat(43);
        PCBuild build = new PCBuild(); build.setId("0123456789abcdef01234567"); build.setSelectedComponents(List.of("111111111111111111111111", "222222222222222222222222"));
        when(builds.findByIdAndSessionTokenHash(build.getId(), OrderService.hashToken(token))).thenReturn(Optional.of(build));
        when(components.findAllById(build.getSelectedComponents())).thenReturn(List.of(component("111111111111111111111111", 1000), component("222222222222222222222222", 2000)));
        when(orders.save(any(Order.class))).thenAnswer(call -> call.getArgument(0));
        OrderService service = new OrderService(builds, components, orders, mock(TestCatalogueGuard.class), 1800);
        OrderCreateRequest request = new OrderCreateRequest(build.getId(), new OrderCreateRequest.Customer("Customer", "c@example.com", "+91 9876543210", "Pune"));
        Order result = service.create(request, token, "order-key-1234567890").order();
        assertEquals(3000L, result.getSubtotalInr());
        assertEquals(540L, result.getTaxInr());
        assertEquals(3540L, result.getTotalInr());
        assertEquals(1, result.getItems().getFirst().getQuantity());
        assertNotEquals(token, result.getAccessTokenHash());
    }

    @Test void unavailableBuildTokenDoesNotExposeOrder() {
        PCBuildRepository builds = mock(PCBuildRepository.class);
        OrderService service = new OrderService(builds, mock(ComponentRepository.class), mock(OrderRepository.class), mock(TestCatalogueGuard.class), 0);
        when(builds.findByIdAndSessionTokenHash(anyString(), anyString())).thenReturn(Optional.empty());
        var request = new OrderCreateRequest("0123456789abcdef01234567", new OrderCreateRequest.Customer("Customer", "c@example.com", "+91 9876543210", "Pune"));
        ApiException error = assertThrows(ApiException.class, () -> service.create(request, "B".repeat(43), "order-key-1234567890"));
        assertEquals(HttpStatus.NOT_FOUND, error.getStatus());
    }

    private static Component component(String id, long price) {
        Component c = new Component(); c.setId(id); c.setName("Demo part"); c.setBrand("Example"); c.setModel("Model"); c.setCategory("CPU"); c.setPriceInr(price); c.setStockStatus("in_stock"); c.setActive(true); return c;
    }
}
