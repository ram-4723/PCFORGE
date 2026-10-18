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
                item("Ryzen 3 3200G (TEST)", "Processors (CPU)", "AMD", "TEST-R3-3200G", 5000,
                        Map.of("socket", "AM4", "cores", 4, "threads", 4, "tdpWatts", 65, "testCatalog", true)),
                item("Ryzen 5 5600G (TEST)", "Processors (CPU)", "AMD", "TEST-R5-5600G", 11900,
                        Map.of("socket", "AM4", "cores", 6, "threads", 12, "tdpWatts", 65, "testCatalog", true)),
                item("Ryzen 5 5600GT (TEST)", "Processors (CPU)", "AMD", "TEST-R5-5600GT", 13500,
                        Map.of("socket", "AM4", "cores", 6, "threads", 12, "tdpWatts", 65, "testCatalog", true)),
                item("Ryzen 7 5700G (TEST)", "Processors (CPU)", "AMD", "TEST-R7-5700G", 17500,
                        Map.of("socket", "AM4", "cores", 8, "threads", 16, "tdpWatts", 65, "testCatalog", true)),
                item("A320M DDR4 Motherboard (TEST)", "Motherboards", "PCForge Test Data", "TEST-A320M-DDR4", 4000,
                        boardSpecs("TEST-R3-3200G,TEST-R5-5600G,TEST-R5-5600GT,TEST-R7-5700G")),
                item("A520M DDR4 Motherboard (TEST)", "Motherboards", "PCForge Test Data", "TEST-A520M-DDR4", 5500,
                        boardSpecs("TEST-R3-3200G,TEST-R5-5600G,TEST-R5-5600GT,TEST-R7-5700G")),
                item("B550M DDR4 Motherboard (TEST)", "Motherboards", "MSI", "TEST-B550M-DDR4", 8200,
                        boardSpecs("TEST-R3-3200G,TEST-R5-5600G,TEST-R5-5600GT,TEST-R7-5700G")),
                item("DDR4 8 GB Memory (TEST)", "RAM", "PCForge Test Data", "TEST-DDR4-8GB", 1400,
                        ramSpecs(8, 1)),
                item("Vengeance LPX DDR4 Memory Kit (TEST)", "RAM", "Corsair", "TEST-CORSAIR-DDR4-16", 3400,
                        ramSpecs(16, 2)),
                item("DDR4 32 GB Memory Kit (TEST)", "RAM", "PCForge Test Data", "TEST-DDR4-32GB", 6200,
                        ramSpecs(32, 2)),
                item("DDR4 64 GB Memory Kit (TEST)", "RAM", "PCForge Test Data", "TEST-DDR4-64GB", 11500,
                        ramSpecs(64, 2)),
                item("480 GB SATA SSD (TEST)", "SSDs and HDDs", "PCForge Test Data", "TEST-SATA-480GB", 2200,
                        Map.of("interface", "SATA", "capacity", "480 GB", "formFactor", "2.5 inch", "testCatalog", true)),
                item("Crucial P3 1 TB NVMe SSD (TEST)", "SSDs and HDDs", "Crucial", "TEST-CT1000P3SSD8", 7200,
                        Map.of("interface", "NVMe", "capacity", "1 TB", "formFactor", "M.2 2280", "testCatalog", true)),
                item("2 TB NVMe SSD (TEST)", "SSDs and HDDs", "PCForge Test Data", "TEST-NVME-2TB", 11800,
                        Map.of("interface", "NVMe", "capacity", "2 TB", "formFactor", "M.2 2280", "testCatalog", true)),
                item("450 W Bronze PSU (TEST)", "Power Supplies", "PCForge Test Data", "TEST-PSU-450W", 3000,
                        psuSpecs(450)),
                item("MWE 650 Bronze V2 PSU (TEST)", "Power Supplies", "Cooler Master", "TEST-MWE-650-BRONZE-V2", 5600,
                        psuSpecs(650)),
                item("750 W Gold PSU (TEST)", "Power Supplies", "PCForge Test Data", "TEST-PSU-750W", 8400,
                        psuSpecs(750)),
                item("Compact Micro-ATX Case (TEST)", "PC Cabinets and Cases", "PCForge Test Data", "TEST-MATX-COMPACT", 2800,
                        caseSpecs("Compact Micro-ATX", 330, 165)),
                item("ANT Value Airflow Mid-Tower Case (TEST)", "PC Cabinets and Cases", "ANT Esports", "TEST-ANT-VALUE-AIRFLOW", 6200,
                        caseSpecs("Mid-Tower", 350, 165)),
                item("Premium Airflow Mid-Tower Case (TEST)", "PC Cabinets and Cases", "PCForge Test Data", "TEST-MIDTOWER-PREMIUM", 8900,
                        caseSpecs("Premium Mid-Tower", 380, 170)),
                item("GeForce GTX 1650 4 GB (TEST)", "Graphics Cards (GPU)", "PCForge Test Data", "TEST-GTX1650-4G", 10900,
                        gpuSpecs("4 GB GDDR6", 75, "6-pin", 181)),
                item("GeForce RTX 3050 8 GB (TEST)", "Graphics Cards (GPU)", "PCForge Test Data", "TEST-RTX3050-8G", 19900,
                        gpuSpecs("8 GB GDDR6", 130, "8-pin", 242)),
                item("Dual GeForce RTX 4060 OC 8 GB (TEST)", "Graphics Cards (GPU)", "ASUS", "TEST-DUAL-RTX4060-O8G", 29900,
                        gpuSpecs("8 GB GDDR6", 115, "8-pin", 300)),
                item("AM4 Stock CPU Cooler (TEST)", "CPU Coolers", "PCForge Test Data", "TEST-COOLER-AM4-STOCK", 800,
                        coolerSpecs(54)),
                item("AM4 Tower CPU Cooler (TEST)", "CPU Coolers", "PCForge Test Data", "TEST-COOLER-AM4-TOWER", 2600,
                        coolerSpecs(154)),
                item("AM4 Premium Tower CPU Cooler (TEST)", "CPU Coolers", "PCForge Test Data", "TEST-COOLER-AM4-PREMIUM", 4800,
                        coolerSpecs(160))
        );
    }

    private static Map<String, Object> boardSpecs(String cpuModels) {
        return Map.of("socket", "AM4", "memoryType", "DDR4", "formFactor", "Micro-ATX", "storageInterfaces", "NVMe,SATA", "maxMemoryGb", 128, "memorySlots", 4,
                "supportedCpuModels", cpuModels, "powerConnectors", "24-pin,8-pin EPS", "testCatalog", true);
    }

    private static Map<String, Object> ramSpecs(int capacityGb, int modules) {
        return Map.of("memoryType", "DDR4", "capacityGb", capacityGb, "moduleCount", modules, "testCatalog", true);
    }

    private static Map<String, Object> psuSpecs(int watts) {
        return Map.of("wattage", watts, "efficiency", watts == 750 ? "80 PLUS Gold" : "80 PLUS Bronze",
                "connectors", "24-pin,8-pin EPS,6-pin PCIe,8-pin PCIe", "testCatalog", true);
    }

    private static Map<String, Object> caseSpecs(String type, int gpuClearance, int coolerHeight) {
        return Map.of("caseType", type, "supportedFormFactors", "Micro-ATX,ATX", "gpuClearanceMm", gpuClearance,
                "cpuCoolerHeightMm", coolerHeight, "testCatalog", true);
    }

    private static Map<String, Object> gpuSpecs(String memory, int watts, String connector, int length) {
        return Map.of("memory", memory, "boardPowerWatts", watts, "powerConnectors", connector, "lengthMm", length, "testCatalog", true);
    }

    private static Map<String, Object> coolerSpecs(int height) {
        return Map.of("socket", "AM4", "heightMm", height, "testCatalog", true);
    }

    private static Component item(String name, String category, String brand, String model, long samplePriceInr, Map<String, Object> specs) {
        var item = new Component();
        item.setName(name); item.setCategory(category); item.setBrand(brand); item.setModel(model);
        item.setPriceInr(samplePriceInr); item.setSpecifications(specs); item.setStockStatus("in_stock");
        item.setActive(true); item.setDemoData(true); item.setTestCatalogKey("test:" + model);
        return item;
    }
}
