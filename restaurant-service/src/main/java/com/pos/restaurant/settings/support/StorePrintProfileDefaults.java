package com.pos.restaurant.settings.support;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/**
 * Factory defaults match today's restaurant slips — empty profile must not change print output.
 */
public final class StorePrintProfileDefaults {

    public static final List<String> SLIP_TYPES = List.of("CANCEL", "GUEST_BILL", "KITCHEN", "SHIFT_ITEMS");

    public static final List<String> FIELD_KEYS = List.of(
        "logo",
        "storeName",
        "address",
        "phone",
        "headerTitle",
        "hallTable",
        "waiter",
        "time",
        "items",
        "totals",
        "footer"
    );

    public static final List<String> FONT_IDS = List.of(
        "monospace",
        "times",
        "georgia",
        "arial",
        "courier"
    );

    private StorePrintProfileDefaults() {
    }

    public static Map<String, Object> factory() {
        Map<String, Object> root = new LinkedHashMap<>();
        root.put("logoDataUrl", "");
        root.put("logoMaxHeightMm", 12);
        root.put("storeName", "");
        root.put("address", "");
        root.put("phone", "");
        root.put("defaultFont", "monospace");
        Map<String, Object> slips = new LinkedHashMap<>();
        for (String slip : SLIP_TYPES) {
            slips.put(slip, defaultSlip(slip));
        }
        root.put("slips", slips);
        return root;
    }

    @SuppressWarnings("unchecked")
    public static Map<String, Object> merge(Map<String, Object> incoming) {
        Map<String, Object> base = factory();
        if (incoming == null || incoming.isEmpty()) {
            return base;
        }
        copyString(incoming, base, "logoDataUrl");
        copyNumber(incoming, base, "logoMaxHeightMm", 8, 40);
        copyString(incoming, base, "storeName");
        copyString(incoming, base, "address");
        copyString(incoming, base, "phone");
        String font = stringVal(incoming.get("defaultFont"));
        if (FONT_IDS.contains(font)) {
            base.put("defaultFont", font);
        }
        Object slipsRaw = incoming.get("slips");
        if (!(slipsRaw instanceof Map<?, ?> inSlips)) {
            return base;
        }
        Map<String, Object> outSlips = (Map<String, Object>) base.get("slips");
        for (String slip : SLIP_TYPES) {
            Object one = inSlips.get(slip);
            if (!(one instanceof Map<?, ?> inSlip)) {
                continue;
            }
            outSlips.put(slip, mergeSlip(slip, (Map<String, Object>) castMap(inSlip)));
        }
        return base;
    }

    private static Map<String, Object> defaultSlip(String slip) {
        Map<String, Object> slipMap = new LinkedHashMap<>();
        Map<String, Object> fields = new LinkedHashMap<>();
        for (String key : FIELD_KEYS) {
            fields.put(key, defaultField(slip, key));
        }
        slipMap.put("fields", fields);
        return slipMap;
    }

    private static Map<String, Object> defaultField(String slip, String key) {
        Map<String, Object> field = new LinkedHashMap<>();
        boolean on = switch (key) {
            case "logo", "storeName", "address", "phone", "footer" -> false;
            case "totals" -> "GUEST_BILL".equals(slip) || "SHIFT_ITEMS".equals(slip);
            default -> true;
        };
        // CANCEL: match current ESC/POS (large title + emphasized dish lines).
        boolean cancelEmph = "CANCEL".equals(slip) && ("headerTitle".equals(key) || "items".equals(key));
        String size = cancelEmph ? "lg" : "md";
        boolean bold = cancelEmph || "headerTitle".equals(key);
        field.put("on", on);
        field.put("bold", bold);
        field.put("size", size);
        field.put("font", "inherit");
        return field;
    }

    @SuppressWarnings("unchecked")
    private static Map<String, Object> mergeSlip(String slip, Map<String, Object> incoming) {
        Map<String, Object> base = defaultSlip(slip);
        Object fieldsRaw = incoming.get("fields");
        if (!(fieldsRaw instanceof Map<?, ?> inFields)) {
            return base;
        }
        Map<String, Object> outFields = (Map<String, Object>) base.get("fields");
        for (String key : FIELD_KEYS) {
            Object one = inFields.get(key);
            if (!(one instanceof Map<?, ?> inField)) {
                continue;
            }
            outFields.put(key, mergeField(defaultField(slip, key), castMap(inField)));
        }
        return base;
    }

    private static Map<String, Object> mergeField(Map<String, Object> base, Map<String, Object> incoming) {
        Map<String, Object> out = new LinkedHashMap<>(base);
        if (incoming.containsKey("on")) {
            out.put("on", Boolean.TRUE.equals(incoming.get("on")) || "true".equals(String.valueOf(incoming.get("on"))));
        }
        if (incoming.containsKey("bold")) {
            out.put("bold", Boolean.TRUE.equals(incoming.get("bold")) || "true".equals(String.valueOf(incoming.get("bold"))));
        }
        String size = stringVal(incoming.get("size"));
        if ("sm".equals(size) || "md".equals(size) || "lg".equals(size)) {
            out.put("size", size);
        }
        String font = stringVal(incoming.get("font"));
        if ("inherit".equals(font) || FONT_IDS.contains(font)) {
            out.put("font", font);
        }
        return out;
    }

    private static void copyString(Map<String, Object> from, Map<String, Object> to, String key) {
        if (!from.containsKey(key)) {
            return;
        }
        Object value = from.get(key);
        to.put(key, value == null ? "" : String.valueOf(value));
    }

    private static void copyNumber(Map<String, Object> from, Map<String, Object> to, String key, int min, int max) {
        if (!from.containsKey(key)) {
            return;
        }
        Object value = from.get(key);
        int n;
        if (value instanceof Number num) {
            n = num.intValue();
        } else {
            try {
                n = Integer.parseInt(String.valueOf(value).trim());
            } catch (Exception ignored) {
                return;
            }
        }
        to.put(key, Math.max(min, Math.min(max, n)));
    }

    private static String stringVal(Object value) {
        return value == null ? "" : String.valueOf(value).trim();
    }

    @SuppressWarnings("unchecked")
    private static Map<String, Object> castMap(Map<?, ?> map) {
        return (Map<String, Object>) map;
    }
}
