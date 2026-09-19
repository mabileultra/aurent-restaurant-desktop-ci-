package com.pos.pharmacy.warehouse.support;

import org.junit.jupiter.api.Test;

import java.math.BigDecimal;

import static org.junit.jupiter.api.Assertions.assertEquals;

class PharmacyImportPercentTest {

    @Test
    void keepsVatRateAndDropsMoneyAmounts() {
        assertEquals(new BigDecimal("12.00"), PharmacyImportPercent.vatRate(new BigDecimal("12")));
        assertEquals(new BigDecimal("0.00"), PharmacyImportPercent.vatRate(new BigDecimal("0")));
        assertEquals(BigDecimal.ZERO, PharmacyImportPercent.vatRate(new BigDecimal("224.100")));
        assertEquals(BigDecimal.ZERO, PharmacyImportPercent.vatRate(new BigDecimal("10605.00")));
        assertEquals(BigDecimal.ZERO, PharmacyImportPercent.vatRate(null));
    }
}
