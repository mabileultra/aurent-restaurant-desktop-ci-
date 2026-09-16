package com.pos.shared.money;

import org.junit.jupiter.api.Test;

import java.math.BigDecimal;

import static org.junit.jupiter.api.Assertions.assertEquals;

class TenderNetCalculatorTest {

    @Test
    void fullReturnZeroesRevenue() {
        TenderNet net = TenderNetCalculator.remaining(
            new BigDecimal("10000"),
            new BigDecimal("10000"),
            BigDecimal.ZERO,
            new BigDecimal("10000")
        );
        assertEquals(new BigDecimal("0.00"), net.total());
        assertEquals(new BigDecimal("0.00"), net.cash());
        assertEquals(new BigDecimal("0.00"), net.card());
    }

    @Test
    void partialReturnSubtractsProportionallyFromMixedTender() {
        TenderNet net = TenderNetCalculator.remaining(
            new BigDecimal("100.00"),
            new BigDecimal("40.00"),
            new BigDecimal("60.00"),
            new BigDecimal("25.00")
        );
        assertEquals(new BigDecimal("75.00"), net.total());
        assertEquals(new BigDecimal("30.00"), net.cash());
        assertEquals(new BigDecimal("45.00"), net.card());
    }

    @Test
    void returnedAboveTotalDoesNotGoNegative() {
        TenderNet net = TenderNetCalculator.remaining(
            new BigDecimal("50"),
            new BigDecimal("50"),
            BigDecimal.ZERO,
            new BigDecimal("80")
        );
        assertEquals(new BigDecimal("0.00"), net.total());
    }

    @Test
    void noReturnKeepsOriginalSplit() {
        TenderNet net = TenderNetCalculator.remaining(
            new BigDecimal("12.50"),
            BigDecimal.ZERO,
            new BigDecimal("12.50"),
            BigDecimal.ZERO
        );
        assertEquals(new BigDecimal("12.50"), net.total());
        assertEquals(new BigDecimal("0.00"), net.cash());
        assertEquals(new BigDecimal("12.50"), net.card());
    }
}
