package com.pos.pharmacy.warehouse.support;

import org.junit.jupiter.api.Test;

import java.math.BigDecimal;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNull;

class PharmacyImportRetailRoleTest {

    @Test
    void guessRetailOnlyForRoznica() {
        assertEquals(PharmacyImportRoles.RETAIL, PharmacyImportRoles.guess("Розничная цена"));
        assertEquals(PharmacyImportRoles.RETAIL, PharmacyImportRoles.guess("Chakana narx"));
        assertEquals(PharmacyImportRoles.RETAIL, PharmacyImportRoles.guess("Цена продажи"));
        assertEquals(PharmacyImportRoles.SKIP, PharmacyImportRoles.guess("Сумма розницы"));
    }

    @Test
    void decimalKeepsGroupedPrices() {
        assertEquals(new BigDecimal("12500.50"), PharmacyImportValueParser.decimal("12,500.50"));
        assertEquals(new BigDecimal("12500.50"), PharmacyImportValueParser.decimal("12.500,50"));
        assertEquals(new BigDecimal("12"), PharmacyImportValueParser.decimal("12%"));
        assertEquals(new BigDecimal("10"), PharmacyImportValueParser.decimal("10 шт"));
    }

    @Test
    void decimalKeepsRetailWhenCurrencySuffix() {
        assertEquals(new BigDecimal("12500.50"), PharmacyImportValueParser.decimal("12 500,50 сум"));
        assertNull(PharmacyImportValueParser.decimal(""));
    }
}
