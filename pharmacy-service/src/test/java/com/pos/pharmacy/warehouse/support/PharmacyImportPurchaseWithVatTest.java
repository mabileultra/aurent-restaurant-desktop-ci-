package com.pos.pharmacy.warehouse.support;

import org.junit.jupiter.api.Test;

import java.math.BigDecimal;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNull;

class PharmacyImportPurchaseWithVatTest {

    @Test
    void dividesDidoxLineTotalByQty() {
        BigDecimal unit = PharmacyImportPurchaseWithVat.unitFromCell(
            new BigDecimal("213999.52"),
            new BigDecimal("1741.07"),
            new BigDecimal("100")
        );
        assertEquals(0, new BigDecimal("2140.00").compareTo(unit));
    }

    @Test
    void keepsUnitPriceWhenAlreadyUnit() {
        BigDecimal unit = PharmacyImportPurchaseWithVat.unitFromCell(
            new BigDecimal("2140.00"),
            new BigDecimal("1910.71"),
            new BigDecimal("100")
        );
        assertEquals(0, new BigDecimal("2140.00").compareTo(unit));
    }

    @Test
    void nullSafe() {
        assertNull(PharmacyImportPurchaseWithVat.unitFromCell(null, BigDecimal.TEN, BigDecimal.ONE));
    }
}
