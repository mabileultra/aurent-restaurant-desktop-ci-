package com.pos.catalog.service.product.support;

import org.springframework.util.StringUtils;

import java.util.List;

/**
 * Поиск склада/каталога: сырой КМ → короткий EAN/GTIN для LIKE/equal.
 * Иначе {@code LIKE %010…21serial…%} никогда не попадёт в barcode карточки.
 */
public final class ProductSearchMarkingNormalizer {

    private ProductSearchMarkingNormalizer() {
    }

    /**
     * Если вся строка — один КМ, подставляет предпочтительный штрихкод каталога
     * (обычно EAN-13). Иначе возвращает исходную строку.
     */
    public static String forSearchOrBarcodeFilter(String raw) {
        if (!StringUtils.hasText(raw)) {
            return raw;
        }
        String trimmed = raw.trim();
        if (trimmed.contains(" ") || !ProductMarkingGtinExtractor.looksLikeMarkingCode(trimmed)) {
            return trimmed;
        }
        return preferredCatalogBarcode(ProductBarcodeScanVariants.of(trimmed)).orElse(trimmed);
    }

    static java.util.Optional<String> preferredCatalogBarcode(List<String> variants) {
        if (variants == null || variants.isEmpty()) {
            return java.util.Optional.empty();
        }
        for (String v : variants) {
            if (v != null && v.matches("\\d{13}")) {
                return java.util.Optional.of(v);
            }
        }
        for (String v : variants) {
            if (v != null && v.matches("\\d{8}")) {
                return java.util.Optional.of(v);
            }
        }
        for (String v : variants) {
            if (v != null && v.matches("\\d{14}")) {
                return java.util.Optional.of(v);
            }
        }
        return java.util.Optional.empty();
    }
}
