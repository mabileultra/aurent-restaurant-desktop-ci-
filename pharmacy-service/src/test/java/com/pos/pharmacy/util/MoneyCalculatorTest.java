package com.pos.pharmacy.util;

import org.junit.jupiter.api.Test;

import java.math.BigDecimal;

import static org.junit.jupiter.api.Assertions.assertEquals;

class MoneyCalculatorTest {

    @Test
    void vatFromInclusiveLineAt12Percent() {
        // 11200 inclusive @ 12% => VAT = 11200 * 12 / 112 = 1200
        assertEquals(new BigDecimal("1200.00"), MoneyCalculator.vatFromInclusiveLine(
            new BigDecimal("11200"),
            new BigDecimal("12")
        ));
    }

    @Test
    void vatFromInclusiveLineAtZeroRate() {
        assertEquals(BigDecimal.ZERO, MoneyCalculator.vatFromInclusiveLine(
            new BigDecimal("1000.00"),
            BigDecimal.ZERO
        ));
    }

    @Test
    void vatFromInclusiveLineNullOrNonPositive() {
        assertEquals(BigDecimal.ZERO, MoneyCalculator.vatFromInclusiveLine(null, new BigDecimal("12")));
        assertEquals(BigDecimal.ZERO, MoneyCalculator.vatFromInclusiveLine(BigDecimal.ZERO, new BigDecimal("12")));
        assertEquals(BigDecimal.ZERO, MoneyCalculator.vatFromInclusiveLine(new BigDecimal("-1"), new BigDecimal("12")));
    }

    @Test
    void lineGrossAppliesDiscountAfterQty() {
        // 1000 * 2 = 2000 - 150 = 1850
        assertEquals(new BigDecimal("1850.00"), MoneyCalculator.lineGross(
            new BigDecimal("1000"),
            new BigDecimal("2"),
            new BigDecimal("150")
        ));
    }

    @Test
    void lineGrossDiscountCannotGoNegative() {
        assertEquals(new BigDecimal("0.00"), MoneyCalculator.lineGross(
            new BigDecimal("100"),
            new BigDecimal("1"),
            new BigDecimal("999")
        ));
    }

    @Test
    void vatAfterLineDiscountUsesNetInclusive() {
        BigDecimal gross = MoneyCalculator.lineGross(new BigDecimal("11200"), BigDecimal.ONE, new BigDecimal("1120"));
        // 10080 inclusive @ 12% => 10080 * 12 / 112 = 1080
        assertEquals(new BigDecimal("10080.00"), gross);
        assertEquals(new BigDecimal("1080.00"), MoneyCalculator.vatFromInclusiveLine(gross, new BigDecimal("12")));
    }
}
