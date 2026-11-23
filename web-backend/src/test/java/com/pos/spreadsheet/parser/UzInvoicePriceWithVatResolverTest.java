package com.pos.spreadsheet.parser;

import org.junit.jupiter.api.Test;

import java.math.BigDecimal;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

class UzInvoicePriceWithVatResolverTest {

    @Test
    void prefersLineTotalWithVatOverNetUnitPrice() {
        var price = UzInvoicePriceWithVatResolver.resolveUnitPriceWithVat(
            "75", "28571.43", "2400000.00", "12%"
        );
        assertTrue(price.isPresent());
        assertEquals(new BigDecimal("32000.00"), price.get());
    }

    @Test
    void fallsBackToNetTimesVatRate() {
        var price = UzInvoicePriceWithVatResolver.resolveUnitPriceWithVat(
            "75", "28571.43", "", "12"
        );
        assertTrue(price.isPresent());
        assertEquals(new BigDecimal("32000.00"), price.get());
    }

    @Test
    void blankVatRateKeepsNetWithoutDefault12Percent() {
        var price = UzInvoicePriceWithVatResolver.resolveUnitPriceWithVat(
            "10", "100.00", "", ""
        );
        assertTrue(price.isPresent());
        assertEquals(new BigDecimal("100.00"), price.get());
    }

    @Test
    void nullVatRateKeepsNet() {
        var price = UzInvoicePriceWithVatResolver.resolveUnitPriceWithVat(
            "10", "100.00", null, null
        );
        assertTrue(price.isPresent());
        assertEquals(new BigDecimal("100.00"), price.get());
    }

    @Test
    void doesNotDivideUnitPriceWhenLineTotalEqualsNarx() {
        // Колонка «сумма» ошибочно = «Нарх» (8000), qty=10 → раньше 800.
        var price = UzInvoicePriceWithVatResolver.resolveUnitPriceWithVat(
            "10", "8000", "8000", ""
        );
        assertTrue(price.isPresent());
        assertEquals(new BigDecimal("8000.00"), price.get());
    }

    @Test
    void stillUsesLineTotalWhenItIsRealLineSum() {
        var price = UzInvoicePriceWithVatResolver.resolveUnitPriceWithVat(
            "10", "8000", "80000", "0"
        );
        assertTrue(price.isPresent());
        assertEquals(new BigDecimal("8000.00"), price.get());
    }
}

