package com.pcforge.services;

import com.pcforge.dto.AdminOrderSummary;
import com.pcforge.dto.AdminOverviewStats;
import com.pcforge.dto.AdminUserSummary;
import com.pcforge.dto.Pagination;
import com.pcforge.exception.ApiException;
import com.pcforge.models.Order;
import com.pcforge.models.UserAccount;
import com.pcforge.repositories.OrderRepository;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.*;
import java.util.regex.Pattern;
import org.bson.types.ObjectId;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.data.mongodb.core.query.Query;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;

@Service
public class AdminService {
    public record UserPage(List<AdminUserSummary> users, Pagination pagination) { }
    public record OrderPage(List<AdminOrderSummary> orders, Pagination pagination) { }

    private final AuthService auth;
    private final MongoTemplate mongo;
    private final OrderRepository orders;
    private final InvoiceService invoices;

    public AdminService(AuthService auth, MongoTemplate mongo, OrderRepository orders, InvoiceService invoices) {
        this.auth = auth;
        this.mongo = mongo;
        this.orders = orders;
        this.invoices = invoices;
    }

    public AdminOverviewStats overview(String authorization) {
        auth.requireAdmin(authorization);
        long totalUsers = mongo.count(new Query(), UserAccount.class);
        long totalOrders = mongo.count(new Query(), Order.class);

        List<Order> allOrders = mongo.find(new Query(), Order.class);
        long totalRevenue = 0L;
        long paidCount = 0L;
        Map<String, Long> statusCounts = new HashMap<>();
        Map<String, Long> paymentCounts = new HashMap<>();

        for (Order o : allOrders) {
            String ordStatus = o.getOrderStatus() != null ? o.getOrderStatus() : "awaiting_payment";
            String payStatus = o.getPaymentStatus() != null ? o.getPaymentStatus() : "pending";
            statusCounts.put(ordStatus, statusCounts.getOrDefault(ordStatus, 0L) + 1);
            paymentCounts.put(payStatus, paymentCounts.getOrDefault(payStatus, 0L) + 1);

            if ("paid".equalsIgnoreCase(payStatus)) {
                paidCount++;
                if (o.getTotalInr() != null) {
                    totalRevenue += o.getTotalInr();
                }
            }
        }

        long aov = paidCount > 0 ? (totalRevenue / paidCount) : 0L;
        return new AdminOverviewStats(totalUsers, totalOrders, totalRevenue, aov, statusCounts, paymentCounts);
    }

    public OrderPage orders(String authorization, int page, int size, String search, String status, String paymentStatus) {
        auth.requireAdmin(authorization);
        if (page < 1 || size < 1 || size > 100) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "INVALID_PAGINATION", "page must be at least 1 and size between 1 and 100.");
        }

        List<Criteria> filters = new ArrayList<>();
        if (search != null && !search.isBlank()) {
            String safe = Pattern.quote(search.trim());
            filters.add(new Criteria().orOperator(
                    Criteria.where("orderNumber").regex(safe, "i"),
                    Criteria.where("customer.name").regex(safe, "i"),
                    Criteria.where("customer.email").regex(safe, "i"),
                    Criteria.where("customer.phone").regex(safe, "i")
            ));
        }

        if (status != null && !status.isBlank() && !"all".equalsIgnoreCase(status)) {
            filters.add(Criteria.where("orderStatus").is(status.trim().toLowerCase()));
        }

        if (paymentStatus != null && !paymentStatus.isBlank() && !"all".equalsIgnoreCase(paymentStatus)) {
            filters.add(Criteria.where("paymentStatus").is(paymentStatus.trim().toLowerCase()));
        }

        Criteria criteria = filters.isEmpty() ? new Criteria() : new Criteria().andOperator(filters.toArray(new Criteria[0]));
        long total = mongo.count(Query.query(criteria), Order.class);
        Query query = Query.query(criteria).with(PageRequest.of(page - 1, size, Sort.by(Sort.Direction.DESC, "createdAt")));
        List<AdminOrderSummary> results = mongo.find(query, Order.class).stream().map(AdminOrderSummary::from).toList();
        int pages = total == 0 ? 0 : (int) Math.ceil((double) total / size);
        return new OrderPage(results, new Pagination(page, size, total, pages));
    }

    public Order getOrder(String authorization, String orderId) {
        auth.requireAdmin(authorization);
        return orders.findById(orderId)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "ORDER_NOT_FOUND", "Order " + orderId + " was not found."));
    }

    public Order updateOrderStatus(String authorization, String orderId, String newStatus) {
        auth.requireAdmin(authorization);
        Order order = orders.findById(orderId)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "ORDER_NOT_FOUND", "Order " + orderId + " was not found."));

        order.setOrderStatus(newStatus);
        order.setUpdatedAt(Instant.now());
        return orders.save(order);
    }

    public byte[] getOrderInvoicePdf(String authorization, String orderId) {
        auth.requireAdmin(authorization);
        Order order = orders.findById(orderId)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "ORDER_NOT_FOUND", "Order not found."));

        if ("paid".equals(order.getPaymentStatus())) {
            order = invoices.issueForPaidOrder(orderId);
        }
        return invoices.render(order);
    }

    public UserPage users(String authorization, int page, int size, String search) {
        auth.requireAdmin(authorization);
        if (page < 1 || size < 1 || size > 100) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "INVALID_PAGINATION", "page must be at least 1 and size must be between 1 and 100.");
        }
        Criteria criteria = Criteria.where("role").is("USER");
        if (search != null && !search.isBlank()) {
            String safeSearch = Pattern.quote(search.trim());
            criteria = new Criteria().andOperator(criteria, new Criteria().orOperator(
                    Criteria.where("name").regex(safeSearch, "i"),
                    Criteria.where("email").regex(safeSearch, "i")));
        }
        Query query = Query.query(criteria).with(PageRequest.of(page - 1, size, Sort.by(Sort.Direction.DESC, "registeredAt")));
        long total = mongo.count(Query.query(criteria), UserAccount.class);
        List<AdminUserSummary> results = mongo.find(query, UserAccount.class).stream().map(AdminUserSummary::from).toList();
        int pages = total == 0 ? 0 : (int) Math.ceil((double) total / size);
        return new UserPage(results, new Pagination(page, size, total, pages));
    }

    public Map<String, Object> seedDemoOrders(String authorization) {
        auth.requireAdmin(authorization);
        Instant now = Instant.now();

        List<Order> demoOrders = List.of(
            buildSampleOrder("PCF-2026-8801", "Deepak Sharma", "deepak.sharma@example.com", "+91 98765 43210",
                "Flat 402, Skyline Residency, Outer Ring Road, Bengaluru, Karnataka 560103",
                "shipped", "paid", now.minus(5, ChronoUnit.DAYS),
                List.of(
                    sampleItem("AMD Ryzen 7 7800X3D Gaming Processor", "AMD", "Ryzen 7 7800X3D", "Processors (CPU)", 38999L),
                    sampleItem("NVIDIA GeForce RTX 4080 Super 16GB", "ZOTAC", "RTX 4080 Super Trinity", "Graphics Cards (GPU)", 98999L),
                    sampleItem("ASUS ROG Strix B650E-F Gaming WiFi", "ASUS", "ROG Strix B650E-F", "Motherboards", 24999L),
                    sampleItem("Corsair Vengeance 32GB (2x16GB) DDR5 6000MHz", "Corsair", "Vengeance DDR5", "Memory (RAM)", 10999L),
                    sampleItem("Samsung 990 PRO 2TB PCIe 4.0 NVMe SSD", "Samsung", "990 PRO 2TB", "Storage (SSD/HDD)", 17499L),
                    sampleItem("Corsair RM850x 850W 80+ Gold Fully Modular PSU", "Corsair", "RM850x", "Power Supplies (PSU)", 12499L),
                    sampleItem("NZXT H9 Flow Dual-Chamber ATX Mid-Tower Case", "NZXT", "H9 Flow", "PC Cases", 14999L)
                )
            ),
            buildSampleOrder("PCF-2026-8802", "Priya Patel", "priya.patel@designstudio.in", "+91 98123 45678",
                "Plot 18, Phase 2, Hi-Tech City, Hyderabad, Telangana 500081",
                "assembling", "paid", now.minus(3, ChronoUnit.DAYS),
                List.of(
                    sampleItem("Intel Core i7-14700K 20-Core Processor", "Intel", "Core i7-14700K", "Processors (CPU)", 37499L),
                    sampleItem("Gigabyte GeForce RTX 4070 Ti Super 16GB", "Gigabyte", "RTX 4070 Ti Super Gaming OC", "Graphics Cards (GPU)", 82999L),
                    sampleItem("MSI MAG Z790 Tomahawk WiFi Motherboard", "MSI", "MAG Z790 Tomahawk", "Motherboards", 27999L),
                    sampleItem("G.Skill Ripjaws S5 64GB (2x32GB) DDR5 6000MHz", "G.Skill", "Ripjaws S5", "Memory (RAM)", 19999L),
                    sampleItem("Crucial T500 2TB Gen4 NVMe SSD with Heatsink", "Crucial", "T500 2TB", "Storage (SSD/HDD)", 14999L),
                    sampleItem("DeepCool LT720 360mm High-Performance AIO Cooler", "DeepCool", "LT720", "Cooling Systems", 9999L),
                    sampleItem("Antec NeoECO Gold Modular 850W Power Supply", "Antec", "NE850G", "Power Supplies (PSU)", 9499L),
                    sampleItem("Lian Li O11 Dynamic EVO RGB Case", "Lian Li", "O11D EVO", "PC Cases", 15999L)
                )
            ),
            buildSampleOrder("PCF-2026-8803", "Aditya Verma", "aditya.v@gaminghub.com", "+91 97654 32109",
                "Tower B, 11th Floor, Sector 62, Noida, Uttar Pradesh 201309",
                "tested", "paid", now.minus(2, ChronoUnit.DAYS),
                List.of(
                    sampleItem("AMD Ryzen 5 7600X 6-Core Processor", "AMD", "Ryzen 5 7600X", "Processors (CPU)", 19499L),
                    sampleItem("ZOTAC Gaming GeForce RTX 4060 Ti Twin Edge 8GB", "ZOTAC", "RTX 4060 Ti", "Graphics Cards (GPU)", 38499L),
                    sampleItem("MSI B650M Gaming Plus WiFi", "MSI", "B650M Gaming Plus", "Motherboards", 14499L),
                    sampleItem("Corsair Vengeance 32GB (2x16GB) DDR5 5600MHz", "Corsair", "Vengeance DDR5", "Memory (RAM)", 8999L),
                    sampleItem("Western Digital Black SN770 1TB NVMe SSD", "WD", "SN770 1TB", "Storage (SSD/HDD)", 6999L),
                    sampleItem("Cooler Master MWE 650W 80+ Bronze V2 PSU", "Cooler Master", "MWE 650", "Power Supplies (PSU)", 5499L),
                    sampleItem("Montech Air 903 Max High Airflow ATX Case", "Montech", "Air 903 Max", "PC Cases", 6499L)
                )
            ),
            buildSampleOrder("PCF-2026-8804", "Sneha Nair", "sneha.nair@innovate.co", "+91 98450 11223",
                "Villa 14, Palm Meadows, Whitefield, Bengaluru, Karnataka 560066",
                "delivered", "paid", now.minus(12, ChronoUnit.DAYS),
                List.of(
                    sampleItem("AMD Ryzen 7 7700X 8-Core Processor", "AMD", "Ryzen 7 7700X", "Processors (CPU)", 28999L),
                    sampleItem("MSI GeForce RTX 4070 Ventus 2X 12G OC", "MSI", "RTX 4070 Ventus 2X", "Graphics Cards (GPU)", 54999L),
                    sampleItem("ASUS TUF Gaming B650-PLUS WiFi", "ASUS", "TUF B650-PLUS", "Motherboards", 19999L),
                    sampleItem("Kingston Fury Beast 32GB (2x16GB) DDR5 6000", "Kingston", "Fury Beast", "Memory (RAM)", 9999L),
                    sampleItem("Samsung 980 1TB M.2 NVMe SSD", "Samsung", "980 1TB", "Storage (SSD/HDD)", 6499L),
                    sampleItem("Corsair RM750e 750W 80+ Gold Modular PSU", "Corsair", "RM750e", "Power Supplies (PSU)", 9499L),
                    sampleItem("Corsair 4000D Airflow Tempered Glass Mid-Tower", "Corsair", "4000D Airflow", "PC Cases", 7499L)
                )
            ),
            buildSampleOrder("PCF-2026-8805", "Rohan Gupta", "rohan.g@techstarter.dev", "+91 99100 23456",
                "B-304, Green Glen Layout, Bellandur, Bengaluru, Karnataka 560103",
                "awaiting_payment", "pending", now.minus(1, ChronoUnit.HOURS),
                List.of(
                    sampleItem("AMD Ryzen 5 5600 6-Core Processor", "AMD", "Ryzen 5 5600", "Processors (CPU)", 11999L),
                    sampleItem("ASRock AMD Radeon RX 7600 Challenger 8GB", "ASRock", "RX 7600 Challenger", "Graphics Cards (GPU)", 25499L),
                    sampleItem("MSI B450M PRO-VDH MAX Motherboard", "MSI", "B450M PRO-VDH", "Motherboards", 5499L),
                    sampleItem("G.Skill Ripjaws V 16GB (2x8GB) DDR4 3200MHz", "G.Skill", "Ripjaws V DDR4", "Memory (RAM)", 3499L),
                    sampleItem("Crucial P3 Plus 1TB PCIe 4.0 3D NAND NVMe", "Crucial", "P3 Plus 1TB", "Storage (SSD/HDD)", 5499L),
                    sampleItem("DeepCool PK550D 550W 80+ Bronze Certified PSU", "DeepCool", "PK550D", "Power Supplies (PSU)", 3699L),
                    sampleItem("Ant Esports ICE-100 Air Mini Micro-ATX Case", "Ant Esports", "ICE-100", "PC Cases", 2899L)
                )
            ),
            buildSampleOrder("PCF-2026-8806", "Ananya Deshmukh", "ananya.ai@researchlabs.org", "+91 98234 56789",
                "7th Floor, Cyber One, Sector 30A, Vashi, Navi Mumbai, Maharashtra 400703",
                "assembling", "paid", now.minus(1, ChronoUnit.DAYS),
                List.of(
                    sampleItem("AMD Ryzen 9 7950X 16-Core 32-Thread Processor", "AMD", "Ryzen 9 7950X", "Processors (CPU)", 52999L),
                    sampleItem("ASUS ROG Strix GeForce RTX 4090 24GB OC", "ASUS", "ROG Strix RTX 4090", "Graphics Cards (GPU)", 194999L),
                    sampleItem("ASRock X670E Taichi Flagship Motherboard", "ASRock", "X670E Taichi", "Motherboards", 46999L),
                    sampleItem("Corsair Dominator Titanium 64GB (2x32GB) DDR5 6000", "Corsair", "Dominator Titanium", "Memory (RAM)", 26999L),
                    sampleItem("Samsung 990 PRO 4TB PCIe 4.0 NVMe SSD", "Samsung", "990 PRO 4TB", "Storage (SSD/HDD)", 33999L),
                    sampleItem("Seasonic PRIME TX-1000 1000W 80+ Titanium Modular PSU", "Seasonic", "PRIME TX-1000", "Power Supplies (PSU)", 28999L),
                    sampleItem("Lian Li Galahad II LCD 360 High-End Liquid Cooler", "Lian Li", "Galahad II LCD", "Cooling Systems", 21999L),
                    sampleItem("Fractal Design North XL Charcoal Black Mesh Case", "Fractal Design", "North XL Mesh", "PC Cases", 18999L)
                )
            )
        );

        int count = 0;
        for (Order o : demoOrders) {
            mongo.save(o);
            count++;
        }
        return Map.of("seededCount", count, "message", "Successfully seeded " + count + " realistic PCForge orders.");
    }

    private static Order buildSampleOrder(String orderNumber, String name, String email, String phone, String address,
                                          String orderStatus, String paymentStatus, Instant timestamp, List<Order.Item> items) {
        Order order = new Order();
        order.setId(new ObjectId().toHexString());
        order.setOrderNumber(orderNumber);
        order.setOrderStatus(orderStatus);
        order.setPaymentStatus(paymentStatus);
        order.setCreatedAt(timestamp);
        order.setUpdatedAt(timestamp);

        long subtotal = items.stream().mapToLong(Order.Item::getLineTotalInr).sum();
        long tax = Math.round(subtotal * 0.18); // 18% GST standard in India
        order.setSubtotalInr(subtotal);
        order.setTaxRateBps(1800);
        order.setTaxInr(tax);
        order.setDiscountInr(0L);
        order.setTotalInr(subtotal + tax);

        Order.Customer customer = new Order.Customer();
        customer.setName(name);
        customer.setEmail(email);
        customer.setPhone(phone);
        customer.setAddress(address);
        order.setCustomer(customer);
        order.setItems(items);

        if ("paid".equalsIgnoreCase(paymentStatus)) {
            order.setInvoiceNumber("INV-2026-" + orderNumber.substring(orderNumber.length() - 4));
            order.setInvoiceType("TAX_INVOICE");
        }

        return order;
    }

    private static Order.Item sampleItem(String name, String brand, String model, String category, Long priceInr) {
        Order.Item item = new Order.Item();
        item.setComponentId(new ObjectId().toHexString());
        item.setName(name);
        item.setBrand(brand);
        item.setModel(model);
        item.setCategory(category);
        item.setQuantity(1);
        item.setUnitPriceInr(priceInr);
        item.setLineTotalInr(priceInr);
        return item;
    }
}
