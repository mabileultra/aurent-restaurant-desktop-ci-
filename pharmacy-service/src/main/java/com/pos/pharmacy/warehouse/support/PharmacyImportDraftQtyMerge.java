package com.pos.pharmacy.warehouse.support;

import com.pos.pharmacy.warehouse.dto.PharmacyStockReceiptLineRequest;
import com.pos.pharmacy.warehouse.dto.importing.PharmacyImportConfirmItem;
import com.pos.pharmacy.warehouse.entity.StockReceipt;
import com.pos.pharmacy.warehouse.entity.StockReceiptLine;

import java.math.BigDecimal;
import java.util.HashMap;
import java.util.Map;
import java.util.UUID;

/**
 * Повторный импорт на черновик: qty прибавляется к существующей строке того же productId.
 */
public final class PharmacyImportDraftQtyMerge {

    private PharmacyImportDraftQtyMerge() {
    }

    public static Map<UUID, StockReceiptLine> linesByProduct(StockReceipt receipt) {
        Map<UUID, StockReceiptLine> map = new HashMap<>();
        if (receipt == null || receipt.getLines() == null) {
            return map;
        }
        for (StockReceiptLine line : receipt.getLines()) {
            if (line.getProduct() != null && line.getProduct().getId() != null) {
                map.putIfAbsent(line.getProduct().getId(), line);
            }
        }
        return map;
    }

    public static PharmacyStockReceiptLineRequest withAddedQty(
        StockReceiptLine existing,
        PharmacyImportConfirmItem item,
        PharmacyStockReceiptLineRequest fromImport
    ) {
        BigDecimal current = existing.getQuantity() != null ? existing.getQuantity() : BigDecimal.ZERO;
        BigDecimal add = item.quantity() != null ? item.quantity() : BigDecimal.ZERO;
        return new PharmacyStockReceiptLineRequest(
            fromImport.productId(),
            current.add(add),
            fromImport.purchasePrice(),
            fromImport.unitSellingPrice(),
            fromImport.vatPercent(),
            fromImport.markupPercent(),
            fromImport.unitsInPack() != null ? fromImport.unitsInPack() : existing.getUnitsInPack(),
            fromImport.purchasePriceWithVat(),
            fromImport.retailPrice(),
            fromImport.unitRetailPrice(),
            fromImport.batchNumber() != null ? fromImport.batchNumber() : existing.getBatchNumber(),
            fromImport.expiryDate() != null ? fromImport.expiryDate() : existing.getExpiryDate()
        );
    }
}
