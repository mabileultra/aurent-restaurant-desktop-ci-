package com.pos.catalog.service.product.support;

import org.junit.jupiter.api.Test;

import java.math.BigDecimal;

import static org.junit.jupiter.api.Assertions.assertEquals;

class StockRetailValueMathTest {

    @Test
    void negativeQtyDoesNotReduceRetailValue() {
        assertEquals(
            new BigDecimal("0.00"),
            StockRetailValueMath.scaleMoney(
                StockRetailValueMath.lineValue(new BigDecimal("1000"), new BigDecimal("-5"))
            )
        );
    }

    @Test
    void positiveQtyUsesPriceTimesQty() {
        assertEquals(
            new BigDecimal("5000.00"),
            StockRetailValueMath.scaleMoney(
                StockRetailValueMath.lineValue(new BigDecimal("1000"), new BigDecimal("5"))
            )
        );
    }
}
