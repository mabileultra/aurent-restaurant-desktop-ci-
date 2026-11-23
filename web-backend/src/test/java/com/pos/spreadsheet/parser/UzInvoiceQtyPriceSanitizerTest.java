package com.pos.spreadsheet.parser;

import org.junit.jupiter.api.Test;

import java.math.BigDecimal;

import static org.junit.jupiter.api.Assertions.assertEquals;

class UzInvoiceQtyPriceSanitizerTest {

    @Test
    void recoversWhenQtyIsLineTotalAndUnitPriceIsOneCent() {
        // Сдвиг колонок: qty=6_000_000 (сумма), unit=0.01; Нарҳ=7142.86, сумма с НДС=60_000
        var sane = UzInvoiceQtyPriceSanitizer.sanitize(
            new BigDecimal("6000000"),
            new BigDecimal("0.01"),
            "7 142.86",
            "60 000.00",
            "12%"
        );
        assertEquals(0, new BigDecimal("8000.00").compareTo(sane.unitPriceWithVat()));
        assertEquals(0, new BigDecimal("7.500").compareTo(sane.qty()));
    }

    @Test
    void leavesHealthyRowAlone() {
        var sane = UzInvoiceQtyPriceSanitizer.sanitize(
            new BigDecimal("288"),
            new BigDecimal("8000.00"),
            "7 142.86",
            "2 304 000.00",
            "12%"
        );
        assertEquals(0, new BigDecimal("288").compareTo(sane.qty()));
        assertEquals(0, new BigDecimal("8000.00").compareTo(sane.unitPriceWithVat()));
    }
}
