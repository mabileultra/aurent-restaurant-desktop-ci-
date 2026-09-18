package com.pos.reporting.service.support;

import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertEquals;

class NetSoldQuantityTest {

    @Test
    void subtractsReturns() {
        assertEquals(7L, NetSoldQuantity.of(10L, 3L));
    }

    @Test
    void fullReturnIsZero() {
        assertEquals(0L, NetSoldQuantity.of(4L, 4L));
    }

    @Test
    void overReturnDoesNotGoNegative() {
        assertEquals(0L, NetSoldQuantity.of(2L, 5L));
    }
}
