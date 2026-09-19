package com.pos.pharmacy.warehouse.support;

import com.pos.pharmacy.exception.BusinessException;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

class PharmacyMoneyLimitTest {

    @Test
    void decimalRejectsIkpuAndBarcodeAsMoney() {
        assertNull(PharmacyImportValueParser.decimal("08111001017000000"));
        assertNull(PharmacyImportValueParser.decimal("08111001017000000 - Трусы для детей"));
        assertNull(PharmacyImportValueParser.decimal("4602884018285"));
    }

    @Test
    void decimalKeepsInvoicePricesAndQty() {
        assertEquals(new BigDecimal("8034.71"), PharmacyImportValueParser.decimal("8 034.71"));
        assertEquals(new BigDecimal("10.00000"), PharmacyImportValueParser.decimal("10.00000"));
        assertEquals(new BigDecimal("88375.00"), PharmacyImportValueParser.decimal("88 375.00"));
        assertEquals(new BigDecimal("12500.50"), PharmacyImportValueParser.decimal("12,500.50"));
        assertEquals(new BigDecimal("87.192"), PharmacyImportValueParser.decimal("87.192 224.100"));
    }

    @Test
    void numeric18_2RejectsIkpuTimesQty() {
        BigDecimal ikpu = new BigDecimal("8111001017000000");
        BigDecimal lineCost = ikpu.multiply(new BigDecimal("10.000")).setScale(2);
        assertTrue(PharmacyMoneyLimit.fitsNumeric18_2(ikpu));
        assertFalse(PharmacyMoneyLimit.fitsNumeric18_2(lineCost));
        assertThrows(BusinessException.class, () ->
            PharmacyMoneyLimit.requireFitsNumeric18_2(lineCost, "сумма закупки")
        );
    }
}
