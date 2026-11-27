package com.pos.pharmacy.warehouse.support;

import org.junit.jupiter.api.Test;

import java.math.BigDecimal;

import static org.junit.jupiter.api.Assertions.assertEquals;

class PharmacyImportPurchaseResolveTest {

    @Test
    void prefersFacturaGrossOverBasePurchaseColumn() {
        BigDecimal unit = PharmacyImportPurchaseResolve.unitWithoutVat(
            new BigDecimal("1666.50"),
            new BigDecimal("1989868.16"),
            new BigDecimal("12"),
            new BigDecimal("400")
        );
        assertEquals(0, new BigDecimal("4441.67").compareTo(unit));
        assertEquals(0, new BigDecimal("4974.67").compareTo(
            PharmacyImportPurchaseResolve.unitWithVat(
                new BigDecimal("1989868.16"),
                new BigDecimal("400")
            )
        ));
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
