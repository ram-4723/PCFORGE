package com.pcforge.config;

import com.pcforge.models.Component;
import com.pcforge.repositories.ComponentRepository;
import com.pcforge.services.TestCatalogueGuard;
import java.util.List;
import java.util.Map;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.context.annotation.Profile;

/** Inserts clearly labeled local payment-test products into the isolated pcforge_test database. */
@org.springframework.stereotype.Component
@Profile("test-catalog")
@ConditionalOnProperty(name = "pcforge.test-catalog.enabled", havingValue = "true")
public class TestCatalogSeeder implements ApplicationRunner {
    private static final Logger log = LoggerFactory.getLogger(TestCatalogSeeder.class);
    private final ComponentRepository components;
    private final TestCatalogueGuard guard;

    public TestCatalogSeeder(ComponentRepository components, TestCatalogueGuard guard) {
        this.components = components;
        this.guard = guard;
    }

    @Override
    public void run(ApplicationArguments args) {
        if (!guard.isEnabled()) throw new IllegalStateException("Test catalogue is not enabled for this environment.");
        guard.requireEnabled();
        var existing = components.findAll().stream().filter(Component::isDemoData).toList();
        if (components.count() != existing.size()) {
            throw new IllegalStateException("Refusing to seed test inventory into a database containing non-test catalogue records.");
        }
        int created = 0;
        for (Component product : testProducts()) {
            var saved = components.findByTestCatalogKey(product.getTestCatalogKey());
            if (saved.isPresent()) {
                if (!saved.get().isDemoData()) throw new IllegalStateException("Refusing to overwrite a non-test component with a test catalog record.");
                product.setId(saved.get().getId());
            } else created++;
            components.save(product);
        }
        log.info("Test catalogue ready: {} stable test-only items ({} added or refreshed) in isolated database pcforge_test. Sample prices are not live quotes.", testProducts().size(), created);
    }

    static List<Component> testProducts() {
        return List.of(
                item("Ryzen 5 5600G (TEST)", "Processors (CPU)", "AMD", "TEST-R5-5600G", 11900,
                        Map.of("socket", "AM4", "cores", 6, "threads", 12, "tdpWatts", 65, "testCatalog", true)),
                item("B550M DDR4 Motherboard (TEST)", "Motherboards", "MSI", "TEST-B550M-DDR4", 8200,
                        Map.of("socket", "AM4", "memoryType", "DDR4", "formFactor", "Micro-ATX", "storageInterfaces", "NVMe,SATA", "maxMemoryGb", 128, "memorySlots", 4,
                                "supportedCpuModels", "TEST-R5-5600G", "powerConnectors", "24-pin,8-pin EPS", "testCatalog", true)),
                item("Vengeance LPX DDR4 Memory Kit (TEST)", "RAM", "Corsair", "TEST-CORSAIR-DDR4-16", 3400,
                        Map.of("memoryType", "DDR4", "capacityGb", 16, "moduleCount", 2, "testCatalog", true)),
                item("Crucial P3 1 TB NVMe SSD (TEST)", "SSDs and HDDs", "Crucial", "TEST-CT1000P3SSD8", 7200,
                        Map.of("interface", "NVMe", "capacity", "1 TB", "formFactor", "M.2 2280", "testCatalog", true)),
                item("MWE 650 Bronze V2 PSU (TEST)", "Power Supplies", "Cooler Master", "TEST-MWE-650-BRONZE-V2", 5600,
                        Map.of("wattage", 650, "efficiency", "80 PLUS Bronze", "connectors", "24-pin,8-pin EPS,8-pin PCIe", "testCatalog", true)),
                item("ANT Value Airflow Mid-Tower Case (TEST)", "PC Cabinets and Cases", "ANT Esports", "TEST-ANT-VALUE-AIRFLOW", 6200,
                        Map.of("caseType", "Mid-Tower", "supportedFormFactors", "Micro-ATX,ATX", "gpuClearanceMm", 350, "cpuCoolerHeightMm", 165, "testCatalog", true)),
                item("Dual GeForce RTX 4060 OC 8 GB (TEST)", "Graphics Cards (GPU)", "ASUS", "TEST-DUAL-RTX4060-O8G", 29900,
                        Map.of("memory", "8 GB GDDR6", "boardPowerWatts", 115, "powerConnectors", "8-pin", "lengthMm", 300, "testCatalog", true))
        );
    }

    private static Component item(String name, String category, String brand, String model, long samplePriceInr, Map<String, Object> specs) {
        var item = new Component();
        item.setName(name); item.setCategory(category); item.setBrand(brand); item.setModel(model);
        item.setPriceInr(samplePriceInr); item.setSpecifications(specs); item.setStockStatus("in_stock");
        item.setActive(true); item.setDemoData(true); item.setTestCatalogKey("test:" + model);
        return item;
    }
}
