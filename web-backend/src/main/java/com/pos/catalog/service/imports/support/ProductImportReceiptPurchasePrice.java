package com.pos.catalog.service.imports.support;

import com.pos.catalog.dto.product.ProductImportPreviewRow;

import java.math.BigDecimal;

/**
 * Закупочная цена строки прихода при импорте.
 * В UZ-фактуре цена лежит в {@code fileSellingPrice}, а {@code cost_price} часто 0 —
 * тогда для суммы прихода берём цену из файла.
 */
public final class ProductImportReceiptPurchasePrice {

    private ProductImportReceiptPurchasePrice() {
    }

    public static BigDecimal resolve(ProductImportPreviewRow row) {
        return resolve(row, null);
    }

    /**
     * @param sellingFallback цена продажи из предпросмотра (с наценкой) — крайний fallback
     */
    public static BigDecimal resolve(ProductImportPreviewRow row, BigDecimal sellingFallback) {
        if (row == null) {
            return positiveOrZero(sellingFallback);
        }
        BigDecimal cost = row.costPrice();
        if (cost != null && cost.signum() > 0) {
            return cost;
        }
        BigDecimal fromFile = row.fileSellingPrice();
        if (fromFile != null && fromFile.signum() > 0) {
            return fromFile;
        }
        return positiveOrZero(sellingFallback);
    }

    private static BigDecimal positiveOrZero(BigDecimal value) {
        if (value != null && value.signum() > 0) {
            return value;
        }
        return BigDecimal.ZERO;
    }
}
