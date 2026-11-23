package com.pos.spreadsheet.parser;

import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

class UzInvoiceColumnMapperVatRateTest {

    @Test
    void acceptsRateHeaders() {
        assertTrue(UzInvoiceColumnMapper.isVatRateHeader("ққс ставка"));
        assertTrue(UzInvoiceColumnMapper.isVatRateHeader("ставка ндс"));
        assertTrue(UzInvoiceColumnMapper.isVatRateHeader("vat rate"));
    }

    @Test
    void rejectsVatSumHeaders() {
        assertFalse(UzInvoiceColumnMapper.isVatRateHeader("ққс сумма"));
        assertFalse(UzInvoiceColumnMapper.isVatRateHeader("сумма ндс"));
        assertFalse(UzInvoiceColumnMapper.isVatRateHeader("ндс сумма"));
    }
}
