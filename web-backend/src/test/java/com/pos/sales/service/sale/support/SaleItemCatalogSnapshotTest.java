package com.pos.sales.service.sale.support;

import com.pos.catalog.entity.Product;
import com.pos.domain.SaleType;
import com.pos.domain.UnitCode;
import com.pos.sales.entity.SaleItem;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNull;

class SaleItemCatalogSnapshotTest {

    @Test
    void apply_copiesCardFieldsOntoBuilder() {
        UUID id = UUID.randomUUID();
        Product product = Product.builder()
            .id(id)
            .name("Молоко")
            .sku("SKU-1")
            .barcode(" 460123 ")
            .unitCode(UnitCode.L)
            .saleType(SaleType.WEIGHT)
            .taxRate(new BigDecimal("12"))
            .ikpu("017")
            .sellingPrice(BigDecimal.TEN)
            .build();

        SaleItem.SaleItemBuilder builder = SaleItem.builder()
            .unitPrice(BigDecimal.TEN)
            .quantity(BigDecimal.ONE)
            .lineTotal(BigDecimal.TEN);
        SaleItemCatalogSnapshot.apply(builder, product);
        SaleItem built = builder.build();

        assertEquals(id, built.getProductId());
        assertEquals("Молоко", built.getProductName());
        assertEquals("SKU-1", built.getProductSku());
        assertEquals("460123", built.getProductBarcode());
        assertEquals("L", built.getUnitCode());
        assertEquals("WEIGHT", built.getSaleType());
        assertEquals(new BigDecimal("12"), built.getTaxRate());
        assertEquals("017", built.getIkpu());
    }

    @Test
    void apply_blankBarcodeBecomesNull() {
        Product product = Product.builder()
            .id(UUID.randomUUID())
            .name("X")
            .sku("S")
            .barcode("   ")
            .unitCode(UnitCode.PCS)
            .sellingPrice(BigDecimal.ONE)
            .build();
        SaleItem item = new SaleItem();
        SaleItemCatalogSnapshot.apply(item, product);
        assertNull(item.getProductBarcode());
        assertEquals("PCS", item.getUnitCode());
        assertEquals("PIECE", item.getSaleType());
    }
}
