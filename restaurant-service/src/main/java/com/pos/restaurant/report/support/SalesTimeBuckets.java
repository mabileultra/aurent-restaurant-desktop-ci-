package com.pos.restaurant.report.support;

import com.pos.restaurant.report.dto.SalesBreakdownRow;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.TreeMap;
import java.util.function.Function;

/** Groups payments by local hour / day of the viewer's time zone (the DB stores UTC instants). */
public final class SalesTimeBuckets {

    public record Payment(Instant paidAt, BigDecimal amount) {
    }

    private SalesTimeBuckets() {
    }

    public static List<SalesBreakdownRow> byHour(List<Payment> payments, ZoneId zone) {
        return group(payments, at -> String.format("%02d", LocalDateTime.ofInstant(at, zone).getHour()));
    }

    public static List<SalesBreakdownRow> byDay(List<Payment> payments, ZoneId zone) {
        return group(payments, at -> LocalDateTime.ofInstant(at, zone).toLocalDate().toString());
    }

    private static List<SalesBreakdownRow> group(List<Payment> payments, Function<Instant, String> keyOf) {
        Map<String, long[]> counts = new TreeMap<>();
        Map<String, BigDecimal> sums = new TreeMap<>();
        for (Payment payment : payments) {
            if (payment.paidAt() == null) {
                continue;
            }
            String key = keyOf.apply(payment.paidAt());
            counts.computeIfAbsent(key, k -> new long[1])[0]++;
            sums.merge(key, ReceiptJournalLoader.money(payment.amount()), BigDecimal::add);
        }
        List<SalesBreakdownRow> rows = new ArrayList<>(counts.size());
        counts.forEach((key, count) -> rows.add(new SalesBreakdownRow(key, count[0], sums.get(key))));
        return rows;
    }
}
