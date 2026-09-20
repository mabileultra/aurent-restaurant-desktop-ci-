package com.pos.pharmacy.warehouse.support;

import com.pos.pharmacy.warehouse.domain.PharmacyReceiptMassField;
import com.pos.pharmacy.warehouse.entity.StockReceiptLine;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.Mockito.mock;

class PharmacyReceiptMassApplierUnitsTest {

    private final PharmacyReceiptMassApplier applier =
        new PharmacyReceiptMassApplier(mock(PharmacyReceiptSupport.class));

    @Test
    void updatesUnitsInPackAndUnitRetail() {
        StockReceiptLine line = StockReceiptLine.builder()
            .unitsInPack(BigDecimal.ONE)
            .retailPrice(new BigDecimal("100.00"))
            .unitSellingPrice(new BigDecimal("100.00"))
            .unitRetailPrice(new BigDecimal("100.00"))
            .build();

        applier.apply(line, PharmacyReceiptMassField.UNITS_IN_PACK, "10");

        assertEquals(0, new BigDecimal("10").compareTo(line.getUnitsInPack()));
        assertEquals(0, new BigDecimal("10.00").compareTo(line.getUnitRetailPrice()));
    }
}
