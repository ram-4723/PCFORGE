package com.pcforge.services;

import com.pcforge.exception.ApiException;
import com.pcforge.models.Component;
import com.pcforge.repositories.ComponentRepository;
import org.junit.jupiter.api.Test;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import java.util.List;
import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

class ComponentServiceTest {
    private final ComponentRepository repository = mock(ComponentRepository.class);
    private final ComponentService service = new ComponentService(repository);

    @Test void categoryAndPaginationAreForwardedAndActiveOnlyRepositoryUsed() {
        when(repository.findPublicActiveByCategory(eq("^\\QRAM\\E$"), any())).thenReturn(new PageImpl<>(List.of(new Component(), new Component()), PageRequest.of(1, 5), 7));
        var page = service.list("RAM", 2, 5);
        assertEquals(7, page.getTotalElements());
        verify(repository).findPublicActiveByCategory(eq("^\\QRAM\\E$"), any());
    }

    @Test void invalidCategoryRejected() {
        assertEquals("INVALID_CATEGORY", assertThrows(ApiException.class, () -> service.list("Made-up", 1, 20)).getCode());
    }
    @Test void invalidPaginationRejected() {
        assertThrows(ApiException.class, () -> service.list(null, 0, 20));
        assertThrows(ApiException.class, () -> service.list(null, 1, 101));
    }
    @Test void idsValidatedBeforeRepositoryLookup() {
        assertEquals("INVALID_ID", assertThrows(ApiException.class, () -> service.getActive("not-an-id")).getCode());
        verifyNoInteractions(repository);
    }
}
