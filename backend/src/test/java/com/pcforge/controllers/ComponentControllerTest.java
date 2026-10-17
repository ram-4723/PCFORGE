package com.pcforge.controllers;

import com.pcforge.config.CorsConfiguration;
import com.pcforge.exception.ApiException;
import com.pcforge.services.ComponentService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.context.annotation.Import;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.HttpStatus;
import org.springframework.test.web.servlet.MockMvc;
import java.util.List;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest(ComponentController.class)
@Import({CorsConfiguration.class, com.pcforge.exception.GlobalExceptionHandler.class})
@org.springframework.test.context.TestPropertySource(properties = "pcforge.mongodb-auditing.enabled=false")
class ComponentControllerTest {
    @Autowired MockMvc mvc;
    @MockBean ComponentService service;
    @Test void listReturnsPaginationAndFilters() throws Exception {
        when(service.list("RAM", null, null, null, null, 2, 5, "name")).thenReturn(new PageImpl<>(List.of(), PageRequest.of(1,5), 11));
        mvc.perform(get("/api/components").param("category", "RAM").param("page", "2").param("limit", "5"))
                .andExpect(status().isOk()).andExpect(jsonPath("$.data.components").isArray()).andExpect(jsonPath("$.pagination.page").value(2)).andExpect(jsonPath("$.pagination.total").value(11));
    }
    @Test void componentResponsePreservesStoredBrandAndImageUrl() throws Exception {
        var component = new com.pcforge.models.Component();
        component.setName("Ryzen 5 7600");
        component.setCategory("Processors (CPU)");
        component.setBrand("AMD");
        component.setModel("100-100001015BOX");
        component.setPriceInr(18500L);
        component.setImageUrl("/images/ryzen-5-7600.webp");
        when(service.list(null, null, null, null, null, 1, 20, "name"))
                .thenReturn(new PageImpl<>(List.of(component), PageRequest.of(0, 20), 1));

        mvc.perform(get("/api/components"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.components[0].brand").value("AMD"))
                .andExpect(jsonPath("$.data.components[0].imageUrl").value("/images/ryzen-5-7600.webp"));
    }
    @Test void badPaginationHasConsistentValidationError() throws Exception {
        mvc.perform(get("/api/components").param("page", "0"))
                .andExpect(status().isBadRequest()).andExpect(jsonPath("$.success").value(false)).andExpect(jsonPath("$.error.code").value("VALIDATION_ERROR"));
    }
    @Test void inactiveOrMissingComponentReturnsNotFound() throws Exception {
        when(service.getActive("0123456789abcdef01234567")).thenThrow(new ApiException(HttpStatus.NOT_FOUND, "COMPONENT_NOT_FOUND", "Component not found."));
        mvc.perform(get("/api/components/0123456789abcdef01234567"))
                .andExpect(status().isNotFound()).andExpect(jsonPath("$.error.code").value("COMPONENT_NOT_FOUND"));
    }
}
