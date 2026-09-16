package com.pos.pharmacy.catalog.support;

import java.util.UUID;

/** Освобождает SKU удалённого товара, чтобы тот же артикул можно было создать заново. */
public final class ReleasedCatalogIdentity {

    private static final String MARKER = "#off";

    private ReleasedCatalogIdentity() {}

    public static String sku(String currentSku, UUID productId) {
        String sku = currentSku != null && !currentSku.isBlank() ? currentSku.trim() : "sku";
        if (sku.contains(MARKER) || productId == null) {
            return limit(sku);
        }
        String suffix = MARKER + productId.toString().substring(0, 8);
        int maxBase = 100 - suffix.length();
        if (sku.length() > maxBase) {
            sku = sku.substring(0, maxBase);
        }
        return sku + suffix;
    }

    private static String limit(String sku) {
        return sku.length() <= 100 ? sku : sku.substring(0, 100);
    }
}
