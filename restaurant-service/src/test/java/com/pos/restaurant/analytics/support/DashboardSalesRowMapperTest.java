package com.pos.restaurant.analytics.support;

import org.junit.jupiter.api.Test;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;

class DashboardSalesRowMapperTest {

    @Test
    void mapsDishRows() {
        var rows = DashboardSalesRowMapper.dishes(List.<Object[]>of(
            new Object[]{"Плов", new BigDecimal("84"), new BigDecimal("2940000")}
        ));
        assertEquals(1, rows.size());
        assertEquals("Плов", rows.get(0).dishName());
        assertEquals(new BigDecimal("84"), rows.get(0).quantity());
    }

    @Test
    void mapsHourRows() {
        var rows = DashboardSalesRowMapper.hours(List.<Object[]>of(
            new Object[]{18, 12L, new BigDecimal("2400000")}
        ));
        assertEquals(18, rows.get(0).hour());
        assertEquals(12L, rows.get(0).paymentCount());
    }

    @Test
    void toDecimalHandlesNull() {
        assertEquals(BigDecimal.ZERO, DashboardSalesRowMapper.toDecimal(null));
    }
}

class DashboardLiveSnapshotBuilderMinutesTest {

    @Test
    void minutesBetweenClampsNegative() {
        Instant end = Instant.parse("2026-09-21T12:00:00Z");
        Instant start = Instant.parse("2026-09-21T12:30:00Z");
        assertEquals(0, DashboardLiveSnapshotBuilder.minutesBetween(start, end));
    }

    @Test
    void minutesBetweenPositive() {
        Instant start = Instant.parse("2026-09-21T12:00:00Z");
        Instant end = Instant.parse("2026-09-21T12:42:00Z");
        assertEquals(42, DashboardLiveSnapshotBuilder.minutesBetween(start, end));
    }
}
