package com.pos.sales.service.sale.support;

import com.pos.catalog.entity.Product;
import com.pos.sales.entity.SaleItem;

import java.math.BigDecimal;

/**
 * Freezes catalog card fields onto {@link SaleItem} at sale time.
 * Wave 2.2: no JPA Product on the line — only {@code productId} + snapshot.
 */
public final class SaleItemCatalogSnapshot {

    private SaleItemCatalogSnapshot() {
    }

    public static void apply(SaleItem.SaleItemBuilder builder, Product product) {
        if (builder == null || product == null) {
            return;
        }
        builder.productId(product.getId());
        builder.productName(product.getName());
        builder.productSku(nullToEmpty(product.getSku()));
        builder.productBarcode(blankToNull(product.getBarcode()));
        builder.unitCode(product.getUnitCode() != null ? product.getUnitCode().name() : "PCS");
        builder.unitOfMeasure(blankToNull(product.getUnitOfMeasure()));
        builder.saleType(product.getSaleType() != null ? product.getSaleType().name() : "PIECE");
        builder.taxRate(product.getTaxRate() != null ? product.getTaxRate() : new BigDecimal("12"));
        builder.ikpu(blankToNull(product.getIkpu()));
    }

    public static void apply(SaleItem item, Product product) {
        if (item == null || product == null) {
            return;
        }
        item.setProductId(product.getId());
        item.setProductName(product.getName());
        item.setProductSku(nullToEmpty(product.getSku()));
        item.setProductBarcode(blankToNull(product.getBarcode()));
        item.setUnitCode(product.getUnitCode() != null ? product.getUnitCode().name() : "PCS");
        item.setUnitOfMeasure(blankToNull(product.getUnitOfMeasure()));
        item.setSaleType(product.getSaleType() != null ? product.getSaleType().name() : "PIECE");
        item.setTaxRate(product.getTaxRate() != null ? product.getTaxRate() : new BigDecimal("12"));
        item.setIkpu(blankToNull(product.getIkpu()));
    }

    private static String nullToEmpty(String value) {
        return value != null ? value : "";
    }

    private static String blankToNull(String value) {
        if (value == null || value.isBlank()) {
            return null;
        }
        return value.trim();
    }
}
