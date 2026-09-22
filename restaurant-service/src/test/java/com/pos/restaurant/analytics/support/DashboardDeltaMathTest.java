package com.pos.restaurant.analytics.support;

import org.junit.jupiter.api.Test;

import java.math.BigDecimal;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNull;

class DashboardDeltaMathTest {

    @Test
    void percentDeltaWhenPreviousPositive() {
        assertEquals(
            new BigDecimal("8.4"),
            DashboardDeltaMath.percentDelta(new BigDecimal("12450000"), new BigDecimal("11485000"))
        );
    }

    @Test
    void percentDeltaNullWhenPreviousZero() {
        assertNull(DashboardDeltaMath.percentDelta(new BigDecimal("100"), BigDecimal.ZERO));
    }

    @Test
    void absoluteDelta() {
        assertEquals(12L, DashboardDeltaMath.absoluteDelta(128, 116));
    }
}
