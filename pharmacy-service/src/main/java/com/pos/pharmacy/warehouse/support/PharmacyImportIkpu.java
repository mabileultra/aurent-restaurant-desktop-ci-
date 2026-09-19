package com.pos.pharmacy.warehouse.support;

import java.util.regex.Matcher;
import java.util.regex.Pattern;

/** ИКПУ из ячейки Didox: «06111… - Трусы для детей» → только код. */
public final class PharmacyImportIkpu {

    private static final Pattern CODE = Pattern.compile("\\d{14,17}");

    private PharmacyImportIkpu() {}

    public static String code(String raw) {
        if (raw == null || raw.isBlank()) {
            return null;
        }
        Matcher matcher = CODE.matcher(raw.replaceAll("\\s+", ""));
        if (matcher.find()) {
            return matcher.group();
        }
        matcher = CODE.matcher(raw);
        return matcher.find() ? matcher.group() : null;
    }
}
