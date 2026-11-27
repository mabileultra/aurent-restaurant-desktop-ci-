package com.pos.pharmacy.warehouse.support;

import org.junit.jupiter.api.Test;

import java.math.BigDecimal;

import static org.junit.jupiter.api.Assertions.assertEquals;

class PharmacyImportPurchaseResolveTest {

    @Test
    void prefersExplicitPurchaseColumnOverGross() {
        BigDecimal unit = PharmacyImportPurchaseResolve.unitWithoutVat(
            new BigDecimal("33600"),
            new BigDecimal("2182656"),
            new BigDecimal("12"),
            new BigDecimal("58")
        );
        assertEquals(0, new BigDecimal("33600").compareTo(unit));
    }

    @Test
    void derivesFromGrossWhenPurchaseMissing() {
        BigDecimal unit = PharmacyImportPurchaseResolve.unitWithoutVat(
            null,
            new BigDecimal("2182656"),
            new BigDecimal("12"),
            new BigDecimal("58")
        );
        assertEquals(0, new BigDecimal("33600.00").compareTo(unit));
    }

    @Test
    void fallsBackToPurchaseWhenNoGrossColumn() {
        BigDecimal unit = PharmacyImportPurchaseResolve.unitWithoutVat(
            new BigDecimal("1500"),
            null,
            new BigDecimal("12"),
            new BigDecimal("5")
        );
        assertEquals(0, new BigDecimal("1500").compareTo(unit));
    }
}
