package com.pcforge.services;

import com.pcforge.models.Component;
import org.springframework.stereotype.Service;
import java.util.*;

/** Conservative rule checks: missing structured data always produces an unverified result. */
@Service
public class CompatibilityService {
    public record Finding(String code, String status, String message, List<String> componentIds) {}
    public record Result(String status, List<Finding> findings) {}

    public Result check(List<Component> parts) {
        List<Finding> findings = new ArrayList<>();
        Map<String, Component> byCategory = new HashMap<>();
        for (Component part : parts) {
            String key = category(part.getCategory());
            if (key != null && byCategory.putIfAbsent(key, part) != null)
                findings.add(new Finding("DUPLICATE_CATEGORY", "incompatible", "Select at most one component for each build category.", List.of(part.getId())));
        }
        compare(byCategory, "cpu", "motherboard", "socket", "CPU and motherboard socket values differ.", findings);
        cpuSupport(byCategory, findings);
        compare(byCategory, "ram", "motherboard", "memoryType", "RAM and motherboard memory types differ.", findings);
        memoryCapacity(byCategory, findings);
        supportedFormFactor(byCategory, findings);
        compare(byCategory, "cpu", "cooler", "socket", "CPU and cooler socket support differs.", findings);
        storageInterface(byCategory, findings);
        powerLowerBound(byCategory, findings);
        clearance(byCategory, "gpu", "case", "lengthMm", "gpuClearanceMm", "GPU length exceeds the case GPU clearance.", findings);
        clearance(byCategory, "cooler", "case", "heightMm", "cpuCoolerHeightMm", "Cooler height exceeds the case cooler clearance.", findings);
        if (findings.isEmpty()) findings.add(new Finding("DATA_LIMITED", "unverified", "No known conflict was found; full fit and compatibility remain unverified unless all relevant structured specifications are provided.", parts.stream().map(Component::getId).toList()));
        String status = findings.stream().anyMatch(f -> f.status().equals("incompatible")) ? "incompatible"
                : findings.stream().anyMatch(f -> f.status().equals("unverified")) ? "unverified" : "compatible";
        return new Result(status, findings);
    }

    private void compare(Map<String, Component> parts, String first, String second, String field, String mismatch, List<Finding> out) {
        Component a = parts.get(first), b = parts.get(second);
        if (a == null || b == null) return;
        Object av = a.getSpecifications() == null ? null : a.getSpecifications().get(field);
        Object bv = b.getSpecifications() == null ? null : b.getSpecifications().get(field);
        if (av == null || bv == null) out.add(new Finding("SPECIFICATION_MISSING", "unverified", "Compatibility field '" + field + "' is missing for one or both selected components.", List.of(a.getId(), b.getId())));
        else if (!String.valueOf(av).equalsIgnoreCase(String.valueOf(bv))) out.add(new Finding("SPECIFICATION_MISMATCH", "incompatible", mismatch, List.of(a.getId(), b.getId())));
    }

    private void clearance(Map<String, Component> parts, String partCategory, String caseCategory, String partField, String caseField, String mismatch, List<Finding> out) {
        Component part = parts.get(partCategory), pcCase = parts.get(caseCategory);
        if (part == null || pcCase == null) return;
        Object a = part.getSpecifications() == null ? null : part.getSpecifications().get(partField);
        Object b = pcCase.getSpecifications() == null ? null : pcCase.getSpecifications().get(caseField);
        if (a == null || b == null) out.add(new Finding("SPECIFICATION_MISSING", "unverified", "Clearance cannot be confirmed because '" + partField + "' or '" + caseField + "' is missing.", List.of(part.getId(), pcCase.getId())));
        else if (number(a) == null || number(b) == null) out.add(new Finding("SPECIFICATION_INVALID", "unverified", "Clearance specifications must be numeric millimetre values.", List.of(part.getId(), pcCase.getId())));
        else if (number(a) > number(b)) out.add(new Finding("CLEARANCE_EXCEEDED", "incompatible", mismatch, List.of(part.getId(), pcCase.getId())));
    }
    private void supportedFormFactor(Map<String, Component> parts, List<Finding> out) {
        Component board = parts.get("motherboard"), pcCase = parts.get("case");
        if (board == null || pcCase == null) return;
        Object boardForm = spec(board, "formFactor"), supported = spec(pcCase, "supportedFormFactors");
        if (boardForm == null || supported == null) out.add(new Finding("SPECIFICATION_MISSING", "unverified", "Motherboard form factor or case-supported form factors are missing.", List.of(board.getId(), pcCase.getId())));
        else if (!String.valueOf(supported).toLowerCase(Locale.ROOT).contains(String.valueOf(boardForm).toLowerCase(Locale.ROOT))) out.add(new Finding("FORM_FACTOR_UNSUPPORTED", "incompatible", "Case does not list support for the selected motherboard form factor.", List.of(board.getId(), pcCase.getId())));
    }
    private void storageInterface(Map<String, Component> parts, List<Finding> out) {
        Component storage = parts.get("storage"), board = parts.get("motherboard");
        if (storage == null || board == null) return;
        Object iface = spec(storage, "interface"), supported = spec(board, "storageInterfaces");
        if (iface == null || supported == null) out.add(new Finding("SPECIFICATION_MISSING", "unverified", "Storage interface support cannot be confirmed from the supplied specifications.", List.of(storage.getId(), board.getId())));
        else if (!String.valueOf(supported).toLowerCase(Locale.ROOT).contains(String.valueOf(iface).toLowerCase(Locale.ROOT))) out.add(new Finding("STORAGE_UNSUPPORTED", "incompatible", "Motherboard does not list support for the selected storage interface.", List.of(storage.getId(), board.getId())));
    }
    private void powerLowerBound(Map<String, Component> parts, List<Finding> out) {
        Component psu = parts.get("psu");
        if (psu == null) return;
        long totalKnownDraw = 0;
        boolean foundDraw = false;
        for (String category : List.of("cpu", "gpu")) {
            Component part = parts.get(category); if (part == null) continue;
            Double draw = number(spec(part, category.equals("cpu") ? "tdpWatts" : "boardPowerWatts"));
            if (draw != null) { totalKnownDraw += draw.longValue(); foundDraw = true; }
        }
        Double capacity = number(spec(psu, "wattage"));
        if (capacity == null || !foundDraw) out.add(new Finding("POWER_DATA_MISSING", "unverified", "PSU headroom cannot be assessed because PSU wattage or CPU/GPU power data is missing.", parts.values().stream().map(Component::getId).toList()));
        else if (capacity < totalKnownDraw) out.add(new Finding("PSU_BELOW_KNOWN_LOAD", "incompatible", "PSU wattage is below the combined CPU and GPU power figures supplied in the catalog.", parts.values().stream().map(Component::getId).toList()));
        else {
            Object connectors = spec(psu, "connectors");
            if (!(connectors instanceof String connectorList)) out.add(new Finding("POWER_CONNECTOR_DATA_MISSING", "unverified", "PSU connector inventory is missing; required motherboard/GPU power connectors cannot be verified.", parts.values().stream().map(Component::getId).toList()));
            else for (String category : List.of("motherboard", "cpu", "gpu")) {
                Component part = parts.get(category); if (part == null) continue;
                Object required = spec(part, "powerConnectors");
                if (required == null) { if (category.equals("motherboard") || category.equals("gpu")) out.add(new Finding("POWER_CONNECTOR_DATA_MISSING", "unverified", "Required " + category + " power connectors are not documented.", List.of(part.getId(), psu.getId()))); }
                else for (String connector : String.valueOf(required).split(",")) if (!connectorList.toLowerCase(Locale.ROOT).contains(connector.trim().toLowerCase(Locale.ROOT))) out.add(new Finding("POWER_CONNECTOR_UNSUPPORTED", "incompatible", "PSU does not list required power connector " + connector.trim() + ".", List.of(part.getId(), psu.getId())));
            }
        }
    }
    private void cpuSupport(Map<String, Component> parts, List<Finding> out) {
        Component cpu = parts.get("cpu"), board = parts.get("motherboard"); if (cpu == null || board == null) return;
        Object model = cpu.getModel(), supported = spec(board, "supportedCpuModels");
        if (supported == null) out.add(new Finding("CPU_SUPPORT_UNVERIFIED", "unverified", "Motherboard CPU support and BIOS support list are not documented.", List.of(cpu.getId(), board.getId())));
        else if (!String.valueOf(supported).toLowerCase(Locale.ROOT).contains(String.valueOf(model).toLowerCase(Locale.ROOT))) out.add(new Finding("CPU_SUPPORT_MISMATCH", "incompatible", "Motherboard CPU support list does not include the selected CPU model.", List.of(cpu.getId(), board.getId())));
    }
    private void memoryCapacity(Map<String, Component> parts, List<Finding> out) {
        Component ram = parts.get("ram"), board = parts.get("motherboard"); if (ram == null || board == null) return;
        Double capacity = number(spec(ram, "capacityGb")), maximum = number(spec(board, "maxMemoryGb"));
        if (capacity == null || maximum == null) out.add(new Finding("MEMORY_CAPACITY_UNVERIFIED", "unverified", "RAM capacity and motherboard maximum memory are not both documented.", List.of(ram.getId(), board.getId())));
        else if (capacity > maximum) out.add(new Finding("MEMORY_CAPACITY_EXCEEDED", "incompatible", "Selected RAM capacity exceeds the motherboard maximum memory.", List.of(ram.getId(), board.getId())));
        Double modules = number(spec(ram, "moduleCount")), slots = number(spec(board, "memorySlots"));
        if (modules == null || slots == null) out.add(new Finding("MEMORY_MODULES_UNVERIFIED", "unverified", "RAM module count and motherboard memory slot count are not both documented.", List.of(ram.getId(), board.getId())));
        else if (modules > slots) out.add(new Finding("MEMORY_MODULES_EXCEEDED", "incompatible", "RAM module count exceeds the motherboard memory slot count.", List.of(ram.getId(), board.getId())));
    }
    private static Object spec(Component component, String key) { return component.getSpecifications() == null ? null : component.getSpecifications().get(key); }
    private static Double number(Object value) {
        try { return Double.valueOf(String.valueOf(value)); } catch (NumberFormatException e) { return null; }
    }

    static String category(String value) {
        if (value == null) return null;
        return switch (value.toLowerCase(Locale.ROOT)) {
            case "cpu", "processors (cpu)" -> "cpu"; case "gpu", "graphics cards (gpu)" -> "gpu";
            case "motherboard", "motherboards" -> "motherboard"; case "ram", "memory" -> "ram";
            case "storage", "ssds and hdds" -> "storage"; case "psu", "power supplies" -> "psu";
            case "case", "pc cabinets and cases" -> "case"; case "cpu cooler", "cpu coolers" -> "cooler";
            default -> null;
        };
    }
}
