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
    void farovonUsesDeliveryWithVatColumnNotNarx() {
        // «Етказиб беришнинг ҚҚСни ҳисобга олган ҳолда қиймати» 2 304 000 / 288
        // — не «Нарҳ» 7 142.86 (без НДС).
        var fromVatColumn = UzInvoicePriceWithVatResolver.resolveUnitPriceWithVat(
            "288.000000", "7 142.86", "2 304 000.00", "12%"
        );
        var fromNarxOnly = UzInvoicePriceWithVatResolver.resolveUnitPriceWithVat(
            "288.000000", "7 142.86", "", "12%"
        );
        assertTrue(fromVatColumn.isPresent());
        assertEquals(new BigDecimal("8000.00"), fromVatColumn.get());
        // Нарҳ×1.12 тоже 8000, но SoT — колонка с НДС (сумма поставки), не Нарҳ.
        assertTrue(fromNarxOnly.isPresent());
        assertEquals(new BigDecimal("8000.00"), fromNarxOnly.get());
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

