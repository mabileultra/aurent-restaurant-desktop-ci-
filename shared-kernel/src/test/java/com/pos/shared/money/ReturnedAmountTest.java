package com.pos.shared.money;

import org.junit.jupiter.api.Test;

import java.math.BigDecimal;

import static org.junit.jupiter.api.Assertions.assertEquals;

class ReturnedAmountTest {

    @Test
    void fullReturnIsOriginalTotal() {
        assertEquals(
            new BigDecimal("10000.00"),
            ReturnedAmount.of(new BigDecimal("10000"), BigDecimal.ZERO)
        );
    }

    @Test
    void partialReturnIsDifference() {
        assertEquals(
            new BigDecimal("2500.00"),
            ReturnedAmount.of(new BigDecimal("10000"), new BigDecimal("7500"))
        );
    }

    @Test
    void noReturnIsZero() {
        assertEquals(
            new BigDecimal("0.00"),
            ReturnedAmount.of(new BigDecimal("10000"), new BigDecimal("10000"))
        );
    }
}
