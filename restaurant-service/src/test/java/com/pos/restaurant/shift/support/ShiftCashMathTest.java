package com.pos.restaurant.shift.support;

import com.pos.restaurant.shift.domain.CashOpType;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;

import static org.assertj.core.api.Assertions.assertThat;

class ShiftCashMathTest {

    @Test
    void expectedAddsInAndSubtractsOutAndCollection() {
        ShiftCashMath.Drawer drawer = ShiftCashMath.Drawer.zero()
            .plus(CashOpType.IN, new BigDecimal("20000"))
            .plus(CashOpType.OUT, new BigDecimal("5000"))
            .plus(CashOpType.COLLECTION, new BigDecimal("10000"));

        assertThat(ShiftCashMath.expected(new BigDecimal("50000"), new BigDecimal("30000"), drawer))
            .isEqualByComparingTo("85000.00");
        assertThat(drawer.net()).isEqualByComparingTo("5000.00");
    }

    @Test
    void differenceIsClosingMinusExpected() {
        assertThat(ShiftCashMath.difference(new BigDecimal("49000"), new BigDecimal("50000")))
            .isEqualByComparingTo("-1000.00");
        assertThat(ShiftCashMath.difference(null, new BigDecimal("50000"))).isNull();
    }
}
