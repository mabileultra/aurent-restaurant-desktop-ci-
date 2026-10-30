package com.pos.catalog.service.imports.support;

import java.util.Locale;

/**
 * Режим подтверждения импорта.
 * <p>
 * Остаток (источник истины):
 * <ul>
 *   <li>{@code AS_RECEIPT} — карточка с initialStock=0;
 *       количество (из файла или минус в предпросмотре) идёт только в складской приход.</li>
 *   <li>{@code TO_CATALOG} — без документа прихода; количество строки становится начальным остатком карточки.</li>
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

    /** Приход кладёт количество в документ, не в начальный остаток карточки. */
    public boolean zeroInitialStock() {
        return asReceipt;
    }

    public boolean requiresDefaultStore() {
        return toSelectedStore || asReceipt;
    }
}
