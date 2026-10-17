package com.pcforge.config;

import com.pcforge.repositories.ComponentRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;

import java.util.List;
import java.util.Map;

/** Opt-in local demo data. Adds missing examples only when the collection is empty or demo-only. */
@org.springframework.stereotype.Component
@ConditionalOnProperty(name = "pcforge.seed-demo", havingValue = "true")
public class DemoCatalogSeeder implements ApplicationRunner {
    private static final Logger log = LoggerFactory.getLogger(DemoCatalogSeeder.class);
    private final ComponentRepository components;

    public DemoCatalogSeeder(ComponentRepository components) { this.components = components; }

    @Override
    public void run(ApplicationArguments args) {
        var existing = components.findAll();
        if (existing.stream().anyMatch(item -> !item.isDemoData())) {
            log.warn("Demo catalog seed skipped: non-demo catalog entries exist. No catalog data was changed.");
            return;
        }
        var existingKeys = existing.stream().map(item -> key(item.getCategory(), item.getName())).collect(java.util.stream.Collectors.toSet());
        var demo = demoComponents().stream().filter(item -> !existingKeys.contains(key(item.getCategory(), item.getName()))).toList();
        if (demo.isEmpty()) {
            log.info("Demo catalog already contains all {} sample entries.", demoComponents().size());
            return;
        }
        components.saveAll(demo);
        log.warn("Inserted {} clearly labeled PCForge demo catalog entries ({} total). They are marked out of stock and cannot be ordered.", demo.size(), existing.size() + demo.size());
    }

    static List<com.pcforge.models.Component> demoComponents() {
        return List.of(
                item("Ryzen 5 5600G", "Processors (CPU)", "AMD", "Ryzen 5 5600G", 11900,
                        Map.of("socket", "AM4", "cores", 6, "threads", 12), "/images/5600g.jpg"),
                item("B550M DDR4 Board", "Motherboards", "MSI", "B550M DDR4 Board", 8200,
                        Map.of("socket", "AM4", "memoryType", "DDR4", "formFactor", "Micro-ATX"), "/images/b550.webp"),
                item("Vengeance LPX DDR4 Memory Module", "RAM", "Corsair", "Vengeance LPX DDR4 Memory Module", 3400,
                        Map.of("memoryType", "DDR4"), "/images/corsiar.jpg"),
                item("Crucial P3 1 TB NVMe SSD", "SSDs and HDDs", "Crucial", "CT1000P3SSD8", 7200,
                        Map.of("interface", "NVMe", "capacity", "1 TB", "formFactor", "M.2 2280"), "/images/crucial-p3-1tb.webp"),
                item("MWE 650 Bronze V2", "Power Supplies", "Cooler Master", "MPE-6501-ACAAB", 5600,
                        Map.of("wattage", 650, "efficiency", "80 PLUS Bronze"), "/images/cooler-master-mwe-650-bronze-v2.png"),
                item("ANT Value RGB Airflow Mid-Tower Case", "PC Cabinets and Cases", "ANT Esports", "ANT Value RGB Airflow Mid-Tower Case", 6200,
                        Map.of("caseType", "Mid-Tower"), "/images/pc%20cabineyt.jpg"),
                item("Dual GeForce RTX 4060 OC Edition 8 GB", "Graphics Cards (GPU)", "ASUS", "Dual GeForce RTX 4060 OC Edition", 29900,
                        Map.of("memory", "8 GB GDDR6"), "/images/RTX%204060.jpg"),

                // Additional fictional demo tiers, deliberately not saleable inventory.
                item("Ryzen 3 3200G Demo", "Processors (CPU)", "AMD", "Ryzen 3 3200G (demo)", 6500,
                        Map.of("socket", "AM4", "graphics", "Integrated"), ""),
                item("Ryzen 5 5600 Demo", "Processors (CPU)", "AMD", "Ryzen 5 5600 (demo)", 10500,
                        Map.of("socket", "AM4"), ""),
                item("Core i5-12400F Demo", "Processors (CPU)", "Intel", "Core i5-12400F (demo)", 13800,
                        Map.of("socket", "LGA1700"), "/images/i5%2012400f.jpg"),
                item("Ryzen 5 7600 Demo", "Processors (CPU)", "AMD", "Ryzen 5 7600 (demo)", 18500,
                        Map.of("socket", "AM5"), "/images/ryzen%205%207600.webp"),
                item("Ryzen 7 7800X3D Demo", "Processors (CPU)", "AMD", "Ryzen 7 7800X3D (demo)", 38900,
                        Map.of("socket", "AM5"), ""),

                item("A320M AM4 DDR4 Board Demo", "Motherboards", null, "A320M AM4 DDR4 (demo)", 4500,
                        Map.of("socket", "AM4", "memoryType", "DDR4", "formFactor", "Micro-ATX"), ""),
                item("A620M AM5 DDR5 Board Demo", "Motherboards", null, "A620M AM5 DDR5 (demo)", 9900,
                        Map.of("socket", "AM5", "memoryType", "DDR5", "formFactor", "Micro-ATX"), ""),
                item("B650M Gaming Wi-Fi Demo", "Motherboards", "MSI", "B650M GAMING WIFI (demo)", 15400,
                        Map.of("socket", "AM5", "memoryType", "DDR5", "formFactor", "Micro-ATX"), "/images/b650.webp"),
                item("B760M LGA1700 DDR4 Board Demo", "Motherboards", null, "B760M LGA1700 DDR4 (demo)", 13900,
                        Map.of("socket", "LGA1700", "memoryType", "DDR4", "formFactor", "Micro-ATX"), ""),

                item("16 GB DDR4 Desktop Memory Demo", "RAM", null, "16 GB DDR4 kit (demo)", 1800,
                        Map.of("memoryType", "DDR4", "capacityGb", 16, "moduleCount", 2), ""),
                item("32 GB DDR5 Desktop Memory Demo", "RAM", null, "32 GB DDR5 kit (demo)", 4800,
                        Map.of("memoryType", "DDR5", "capacityGb", 32, "moduleCount", 2), ""),
                item("64 GB DDR5 Desktop Memory Demo", "RAM", null, "64 GB DDR5 kit (demo)", 11000,
                        Map.of("memoryType", "DDR5", "capacityGb", 64, "moduleCount", 2), ""),

                item("480 GB SATA SSD Demo", "SSDs and HDDs", null, "480 GB SATA SSD (demo)", 2200,
                        Map.of("interface", "SATA", "capacity", "480 GB"), ""),
                item("1 TB PCIe 3.0 NVMe SSD Demo", "SSDs and HDDs", null, "1 TB PCIe 3.0 NVMe (demo)", 4500,
                        Map.of("interface", "NVMe", "capacity", "1 TB"), ""),
                item("2 TB PCIe 4.0 NVMe SSD Demo", "SSDs and HDDs", null, "2 TB PCIe 4.0 NVMe (demo)", 12000,
                        Map.of("interface", "NVMe", "capacity", "2 TB"), ""),
                item("1 TB Desktop HDD Demo", "SSDs and HDDs", null, "1 TB SATA HDD (demo)", 3500,
                        Map.of("interface", "SATA", "capacity", "1 TB"), ""),

                item("450 W Bronze PSU Demo", "Power Supplies", null, "450 W Bronze (demo)", 2500,
                        Map.of("wattage", 450, "efficiency", "80 PLUS Bronze"), ""),
                item("550 W Bronze PSU Demo", "Power Supplies", null, "550 W Bronze (demo)", 4200,
                        Map.of("wattage", 550, "efficiency", "80 PLUS Bronze"), ""),
                item("750 W Gold PSU Demo", "Power Supplies", null, "750 W Gold (demo)", 7600,
                        Map.of("wattage", 750, "efficiency", "80 PLUS Gold"), ""),
                item("1000 W Gold PSU Demo", "Power Supplies", null, "1000 W Gold (demo)", 14500,
                        Map.of("wattage", 1000, "efficiency", "80 PLUS Gold"), ""),

                item("Compact Micro-ATX Case Demo", "PC Cabinets and Cases", null, "Compact Micro-ATX (demo)", 2500,
                        Map.of("caseType", "Micro-ATX"), ""),
                item("Airflow Mid-Tower Case Demo", "PC Cabinets and Cases", null, "Airflow Mid-Tower (demo)", 5800,
                        Map.of("caseType", "Mid-Tower"), ""),
                item("Premium Full-Tower Case Demo", "PC Cabinets and Cases", null, "Premium Full-Tower (demo)", 13500,
                        Map.of("caseType", "Full-Tower"), ""),

                item("GeForce GTX 1650 4 GB Demo", "Graphics Cards (GPU)", null, "GTX 1650 4 GB (demo)", 10000,
                        Map.of("memory", "4 GB GDDR6"), ""),
                item("Radeon RX 7600 8 GB Demo", "Graphics Cards (GPU)", "ASUS", "Dual Radeon RX 7600 OC 8 GB (demo)", 21500,
                        Map.of("memory", "8 GB GDDR6"), "/images/rx%206600.jpg"),
                item("GeForce RTX 4070 SUPER Demo", "Graphics Cards (GPU)", null, "RTX 4070 SUPER (demo)", 78000,
                        Map.of("memory", "12 GB GDDR6X"), ""),
                item("GeForce RTX 4090 Demo", "Graphics Cards (GPU)", null, "RTX 4090 (demo)", 180000,
                        Map.of("memory", "24 GB GDDR6X"), ""),
                item("GeForce RTX 5090 Demo", "Graphics Cards (GPU)", null, "RTX 5090 (demo)", 350000,
                        Map.of("memory", "32 GB GDDR7"), ""),

                item("120 mm Air CPU Cooler Demo", "CPU Coolers", null, "120 mm air cooler (demo)", 1400,
                        Map.of("coolingType", "Air"), ""),
                item("240 mm Liquid CPU Cooler Demo", "CPU Coolers", null, "240 mm liquid cooler (demo)", 6500,
                        Map.of("coolingType", "Liquid"), "")
        );
    }

    private static String key(String category, String name) { return category + "\u0000" + name; }

    private static com.pcforge.models.Component item(String name, String category, String brand, String model,
                                                       long demoPriceInr, Map<String, Object> specs, String imageUrl) {
        var item = new com.pcforge.models.Component();
        item.setName(name);
        item.setCategory(category);
        item.setBrand(brand);
        item.setModel(model);
        item.setPriceInr(demoPriceInr);
        item.setSpecifications(specs);
        item.setImageUrl(imageUrl);
        item.setStockStatus("out_of_stock");
        item.setActive(true);
        item.setDemoData(true);
        return item;
    }
}
