package com.pos.restaurant.commission.support;

import com.pos.restaurant.commission.dto.WaiterCommissionOrderRow;
import com.pos.shared.api.PageLimits;
import com.pos.shared.api.PageResponse;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertEquals;

class WaiterCommissionPageResponseTest {

    @Test
    void emptyAndPagedShapesMatchPlatformContract() {
        int page = PageLimits.normalizePage(0);
        int size = PageLimits.normalizeSize(20);
        PageResponse<WaiterCommissionOrderRow> empty = PageResponse.empty(page, size);
        assertEquals(0, empty.totalElements());
        assertEquals(0, empty.totalPages());
        assertEquals(List.of(), empty.content());
        assertEquals(20, empty.size());
        assertEquals(0, empty.number());

        WaiterCommissionOrderRow row = new WaiterCommissionOrderRow(
            UUID.randomUUID(), 7, "A1", Instant.parse("2026-10-01T12:00:00Z"),
            new BigDecimal("100.00"), new BigDecimal("10.00"), new BigDecimal("10.00")
        );
        PageResponse<WaiterCommissionOrderRow> page1 = PageResponse.of(List.of(row), 0, 20, 1);
        assertEquals(1, page1.totalElements());
        assertEquals(1, page1.totalPages());
        assertEquals(1, page1.content().size());
        assertEquals(7, page1.content().get(0).orderNo());
    }
}
