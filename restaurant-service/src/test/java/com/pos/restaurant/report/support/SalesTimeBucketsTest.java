package com.pos.restaurant.report.support;

import com.pos.restaurant.report.dto.SalesBreakdownRow;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.ZoneId;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;

class SalesTimeBucketsTest {

    private static final ZoneId TASHKENT = ZoneId.of("Asia/Tashkent");

    private final List<SalesTimeBuckets.Payment> payments = List.of(
        new SalesTimeBuckets.Payment(Instant.parse("2026-10-01T20:30:00Z"), new BigDecimal("1000")),
        new SalesTimeBuckets.Payment(Instant.parse("2026-10-01T20:59:00Z"), new BigDecimal("500")),
        new SalesTimeBuckets.Payment(Instant.parse("2026-10-01T04:10:00Z"), new BigDecimal("250")),
        new SalesTimeBuckets.Payment(null, new BigDecimal("9"))
    );

    @Test
    void hoursAreLocalToViewerZoneAndSorted() {
        List<SalesBreakdownRow> rows = SalesTimeBuckets.byHour(payments, TASHKENT);

        assertThat(rows).extracting(SalesBreakdownRow::key).containsExactly("01", "09");
        assertThat(rows.get(0).count()).isEqualTo(2);
        assertThat(rows.get(0).amount()).isEqualByComparingTo("1500");
    }

    @Test
    void lateUtcEveningFallsIntoNextLocalDay() {
        List<SalesBreakdownRow> rows = SalesTimeBuckets.byDay(payments, TASHKENT);

        assertThat(rows).extracting(SalesBreakdownRow::key).containsExactly("2026-10-01", "2026-10-02");
        assertThat(rows.get(1).amount()).isEqualByComparingTo("1500");
    }
}
