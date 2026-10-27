package com.pos.catalog.service.imports.support;

import java.util.Locale;

/**
 * Режим подтверждения импорта.
 * <p>
 * Остаток (источник истины):
 * <ul>
 *   <li>{@code TO_CATALOG} / {@code AS_RECEIPT} — карточка с initialStock=0;
 *       при {@code AS_RECEIPT} количество из файла идёт только в складской приход.</li>
 *   <li>{@code AS_FILE} / {@code TO_STORES} — quantity файла → initialStock → RESTOCK при create.</li>
 * </ul>
 * {@code TO_STORES} = выбранный магазин (defaultStoreId обязателен), не «во все магазины».
 */
public record ProductImportStrategy(
    boolean toSelectedStore,
    boolean catalogOnly,
    boolean asReceipt
) {

    public static ProductImportStrategy from(String rawStrategy) {
        String raw = rawStrategy != null ? rawStrategy.trim().toUpperCase(Locale.ROOT) : "AS_FILE";
        boolean toSelectedStore = "TO_STORES".equals(raw);
        boolean catalogOnly = "TO_CATALOG".equals(raw);
        boolean asReceipt = "AS_RECEIPT".equals(raw);
        return new ProductImportStrategy(toSelectedStore, catalogOnly, asReceipt);
    }

    /** Карточка без начального RESTOCK (каталог или приход отдельно). */
    public boolean zeroInitialStock() {
        return catalogOnly || asReceipt;
    }

    public boolean requiresDefaultStore() {
        return toSelectedStore || asReceipt;
    }
}
