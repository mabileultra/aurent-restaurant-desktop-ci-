package com.pos.pharmacy.warehouse.support;

import com.pos.pharmacy.catalog.entity.Product;
import com.pos.pharmacy.warehouse.dto.PharmacyStockReceiptLineRequest;
import com.pos.pharmacy.warehouse.dto.importing.PharmacyImportConfirmItem;
import com.pos.pharmacy.warehouse.entity.StockReceipt;
import com.pos.pharmacy.warehouse.entity.StockReceiptLine;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertEquals;

class PharmacyImportDraftQtyMergeTest {

    @Test
    void linesByProductMapsFirstLine() {
        UUID id = UUID.randomUUID();
        Product product = Product.builder().id(id).build();
        StockReceiptLine line = StockReceiptLine.builder()
            .product(product)
            .quantity(new BigDecimal("2"))
            .build();
        StockReceipt receipt = StockReceipt.builder().lines(List.of(line)).build();

        Map<UUID, StockReceiptLine> map = PharmacyImportDraftQtyMerge.linesByProduct(receipt);
        assertEquals(line, map.get(id));
    }

    @Test
    void withAddedQtySumsQuantityKeepsFilePrices() {
        UUID productId = UUID.randomUUID();
        StockReceiptLine existing = StockReceiptLine.builder()
            .quantity(new BigDecimal("10"))
            .batchNumber("OLD")
            .build();
        PharmacyImportConfirmItem item = new PharmacyImportConfirmItem(
            0, productId, false, "X", null, null,
            new BigDecimal("5"), new BigDecimal("100"), new BigDecimal("112"),
            new BigDecimal("12"), new BigDecimal("120"),
            "NEW", null, null, null, null, List.of(),
            false, null, null, null
        );
        PharmacyStockReceiptLineRequest fromImport = new PharmacyStockReceiptLineRequest(
            productId,
            new BigDecimal("5"),
            new BigDecimal("100"),
            new BigDecimal("120"),
            new BigDecimal("12"),
            new BigDecimal("7.14"),
            BigDecimal.ONE,
            new BigDecimal("112"),
            new BigDecimal("120"),
            new BigDecimal("120"),
            "NEW",
            null
        );

        PharmacyStockReceiptLineRequest merged = PharmacyImportDraftQtyMerge.withAddedQty(
            existing, item, fromImport
        );
        assertEquals(0, new BigDecimal("15").compareTo(merged.quantity()));
        assertEquals(0, new BigDecimal("112").compareTo(merged.purchasePriceWithVat()));
        assertEquals("NEW", merged.batchNumber());
    }
}
