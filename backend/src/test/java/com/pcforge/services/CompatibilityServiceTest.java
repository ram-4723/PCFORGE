package com.pcforge.services;

import com.pcforge.models.Component;
import org.junit.jupiter.api.Test;
import java.util.List;
import java.util.Map;
import static org.junit.jupiter.api.Assertions.*;

class CompatibilityServiceTest {
    private final CompatibilityService service = new CompatibilityService();

    @Test void reportsKnownSocketMismatch() {
        Component cpu = part("CPU", Map.of("socket", "AM4"));
        Component board = part("Motherboard", Map.of("socket", "AM5"));
        var result = service.check(List.of(cpu, board));
        assertEquals("incompatible", result.status());
        assertTrue(result.findings().stream().anyMatch(f -> f.code().equals("SPECIFICATION_MISMATCH")));
    }

    @Test void remainsUnverifiedWhenRequiredSpecificationIsMissing() {
        var result = service.check(List.of(part("CPU", Map.of()), part("Motherboard", Map.of("socket", "AM5"))));
        assertEquals("unverified", result.status());
        assertEquals("SPECIFICATION_MISSING", result.findings().getFirst().code());
    }

    private static Component part(String category, Map<String, Object> specs) {
        Component part = new Component(); part.setId("012345678901234567890123"); part.setCategory(category); part.setSpecifications(specs); return part;
    }
}
