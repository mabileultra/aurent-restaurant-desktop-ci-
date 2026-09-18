package com.pos.pharmacy.marks.support;

import org.junit.jupiter.api.Test;

import static com.pos.pharmacy.marks.entity.StockMarkStatus.IN_STOCK;
import static com.pos.pharmacy.marks.entity.StockMarkStatus.PENDING_WITHDRAW;
import static com.pos.pharmacy.marks.entity.StockMarkStatus.SOLD;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

class StockMarkMonitorAttentionTest {

    @Test
    void pendingAlwaysNeedsAttention() {
        assertTrue(StockMarkMonitorAttention.needsAttention(PENDING_WITHDRAW, null));
        assertTrue(StockMarkMonitorAttention.needsAttention(PENDING_WITHDRAW, "awaiting OFD/ASL"));
    }

    @Test
    void soldWithErrorNeedsAttention() {
        assertTrue(StockMarkMonitorAttention.needsAttention(SOLD, "ASL timeout"));
    }

    @Test
    void soldWithoutErrorIsOk() {
        assertFalse(StockMarkMonitorAttention.needsAttention(SOLD, null));
        assertFalse(StockMarkMonitorAttention.needsAttention(SOLD, "  "));
        assertFalse(StockMarkMonitorAttention.needsAttention(IN_STOCK, null));
    }
}
