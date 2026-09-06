package com.pos.restaurant.commission.support;

import com.pos.restaurant.order.domain.OrderChannel;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

class WaiterCommissionCalculatorTest {

    private final WaiterCommissionCalculator calculator = new WaiterCommissionCalculator();

    @Test
    void appliesOnlyDineIn() {
        assertTrue(calculator.applies(OrderChannel.DINE_IN));
        assertTrue(calculator.applies(null));
        assertFalse(calculator.applies(OrderChannel.TAKEAWAY));
        assertFalse(calculator.applies(OrderChannel.DELIVERY));
    }

    @Test
    void amountFromSubtotal() {
        assertEquals(new BigDecimal("15.00"), calculator.amount(new BigDecimal("150.00"), new BigDecimal("10")));
        assertEquals(new BigDecimal("0.00"), calculator.amount(new BigDecimal("150.00"), BigDecimal.ZERO));
    }

    @Test
    void rejectsInvalidPercent() {
        assertThrows(RuntimeException.class, () -> calculator.normalizePercent(new BigDecimal("-1")));
        assertThrows(RuntimeException.class, () -> calculator.normalizePercent(new BigDecimal("100.01")));
    }
}
