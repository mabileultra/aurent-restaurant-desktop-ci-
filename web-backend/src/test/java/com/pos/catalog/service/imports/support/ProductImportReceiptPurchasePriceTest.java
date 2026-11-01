package com.pos.catalog.service.imports.support;

import com.pos.catalog.dto.product.ProductImportPreviewRow;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;

import static org.junit.jupiter.api.Assertions.assertEquals;

class ProductImportReceiptPurchasePriceTest {

    @Test
    void usesCostWhenPositive() {
        assertEquals(
            new BigDecimal("10.50"),
            ProductImportReceiptPurchasePrice.resolve(row(new BigDecimal("10.50"), new BigDecimal("99")))
        );
    }

    @Test
    void fallsBackToFilePriceWhenCostZero() {
        assertEquals(
            new BigDecimal("25000"),
            ProductImportReceiptPurchasePrice.resolve(row(BigDecimal.ZERO, new BigDecimal("25000")))
        );
    }

    @Test
    void fallsBackToFilePriceWhenCostNull() {
        assertEquals(
            new BigDecimal("100"),
            ProductImportReceiptPurchasePrice.resolve(row(null, new BigDecimal("100")))
        );
    }

    @Test
    void fallsBackToSellingOverrideWhenFileEmpty() {
        assertEquals(
            new BigDecimal("777"),
            ProductImportReceiptPurchasePrice.resolve(row(BigDecimal.ZERO, null), new BigDecimal("777"))
        );
    }

    @Test
    void zeroWhenBothMissing() {
        assertEquals(BigDecimal.ZERO, ProductImportReceiptPurchasePrice.resolve(row(null, null)));
    }

    private static ProductImportPreviewRow row(BigDecimal cost, BigDecimal filePrice) {
        return new ProductImportPreviewRow(
            1, "sku", "name", null, null, null, null, "dona", null, "PIECE",
            BigDecimal.ONE, filePrice, cost, null, null,
            ProductImportPreviewRow.STATUS_NEW, null, null, null
        );
    }
}
