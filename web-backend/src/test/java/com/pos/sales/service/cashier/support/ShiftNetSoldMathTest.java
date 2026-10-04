package com.pos.sales.service.cashier.support;

import org.junit.jupiter.api.Test;

import java.math.BigDecimal;

import static org.junit.jupiter.api.Assertions.assertEquals;

class ShiftNetSoldMathTest {

    @Test
    void partialReturnKeepsTheUnsoldShareOfTheLine() {
        BigDecimal qty = new BigDecimal("10");
        BigDecimal returned = new BigDecimal("4");
        BigDecimal line = new BigDecimal("10000");

        assertEquals(new BigDecimal("6.000"), ShiftNetSoldMath.netQuantity(qty, returned));
        assertEquals(new BigDecimal("6000.00"), ShiftNetSoldMath.netAmount(qty, returned, line));
    }

    @Test
    void fullReturnAndZeroQuantityContributeNothing() {
        assertEquals(new BigDecimal("0.000"), ShiftNetSoldMath.netQuantity(new BigDecimal("2"), new BigDecimal("2")));
        assertEquals(new BigDecimal("0.00"), ShiftNetSoldMath.netAmount(new BigDecimal("2"), new BigDecimal("2"), new BigDecimal("5000")));
        assertEquals(new BigDecimal("0.00"), ShiftNetSoldMath.netAmount(BigDecimal.ZERO, BigDecimal.ZERO, new BigDecimal("100")));
        assertEquals(new BigDecimal("0.00"), ShiftNetSoldMath.netAmount(new BigDecimal("1"), new BigDecimal("5"), new BigDecimal("100")));
    }

    @Test
    void missingReturnKeepsTheWholeLine() {
        assertEquals(new BigDecimal("1.500"), ShiftNetSoldMath.netQuantity(new BigDecimal("1.5"), null));
        assertEquals(new BigDecimal("22500.00"), ShiftNetSoldMath.netAmount(new BigDecimal("1.5"), null, new BigDecimal("22500")));
    }

    @Test
    void roundsMoneyHalfUp() {
        assertEquals(new BigDecimal("33.33"), ShiftNetSoldMath.netAmount(new BigDecimal("3"), new BigDecimal("2"), new BigDecimal("100")));
    }
}
