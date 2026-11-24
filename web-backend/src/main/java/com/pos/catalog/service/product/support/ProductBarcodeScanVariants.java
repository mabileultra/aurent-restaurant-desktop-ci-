package com.pos.catalog.service.product.support;

import org.springframework.util.StringUtils;

import java.util.ArrayList;
import java.util.LinkedHashSet;
import java.util.List;

/**
 * Варианты скана для grocery by-barcode / поиска:
 * EAN-13 ↔ GTIN-14 ↔ 12 без check digit, плюс GTIN из КМ (DataMatrix).
 */
public final class ProductBarcodeScanVariants {

    private ProductBarcodeScanVariants() {
    }

    public static List<String> of(String raw) {
        if (!StringUtils.hasText(raw)) {
            return List.of();
        }
        String trimmed = raw.trim();
        String digits = ProductMarkingGtinExtractor.digitsOnly(trimmed);
        LinkedHashSet<String> out = new LinkedHashSet<>();
        out.add(trimmed);
        if (StringUtils.hasText(digits) && !digits.equals(trimmed)) {
            out.add(digits);
        }
        addEanGtinPads(out, digits);

        String gtin14 = ProductMarkingGtinExtractor.extractGtin14(trimmed);
        if (StringUtils.hasText(gtin14)) {
            addGtinLookupVariants(out, gtin14);
        }
        return new ArrayList<>(out);
    }

    private static void addEanGtinPads(LinkedHashSet<String> out, String digits) {
        if (digits.length() == 13) {
            out.add(digits.substring(0, 12));
            out.add("0" + digits);
        }
        if (digits.length() == 14 && digits.startsWith("0")) {
            out.add(digits.substring(1));
            if (digits.startsWith("00")) {
                out.add(digits.substring(2));
            }
        }
        if (digits.length() == 12) {
            out.add("0" + digits);
        }
    }

    /** Как frontend {@code barcodeLookupVariants}. */
    private static void addGtinLookupVariants(LinkedHashSet<String> out, String gtin) {
        String digits = ProductMarkingGtinExtractor.digitsOnly(gtin);
        if (digits.length() < 8 || digits.length() > 14) {
            return;
        }
        out.add(digits);

        String consumerEan13 = ProductMarkingGtinExtractor.ean13FromPackGtin14(digits);
        if (StringUtils.hasText(consumerEan13)) {
            out.add(consumerEan13);
            out.add("0" + consumerEan13);
            out.add("0" + digits.substring(1));
            addStrippedLeadingZeros(out, consumerEan13);
        }

        addStrippedLeadingZeros(out, digits);
        if (digits.length() < 14) {
            out.add(padLeft(digits, 14));
        }
        if (digits.length() == 13) {
            out.add("0" + digits);
        }
        if (digits.length() == 12) {
            out.add("0" + digits);
            out.add("00" + digits);
        }
        if (digits.length() == 8) {
            out.add(padLeft(digits, 12));
            out.add(padLeft(digits, 13));
            out.add(padLeft(digits, 14));
        }
    }

    private static void addStrippedLeadingZeros(LinkedHashSet<String> out, String digits) {
        String stripped = digits;
        while (stripped.startsWith("0") && stripped.length() > 8) {
            stripped = stripped.substring(1);
            out.add(stripped);
        }
    }

    private static String padLeft(String digits, int len) {
        if (digits.length() >= len) {
            return digits;
        }
        return "0".repeat(len - digits.length()) + digits;
    }
}
