package com.pos.reporting.export.support;

import com.pos.reporting.dto.stock.StockDashboardDayPoint;
import com.pos.reporting.dto.stock.StockDashboardWriteOffDayPoint;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

public final class StockDashboardDailyMerger {

    private StockDashboardDailyMerger() {
    }

    public static List<StockDashboardDayPoint> merge(
        LocalDate from,
        LocalDate to,
        List<Object[]> receivedRows,
        List<Object[]> soldRows,
        List<StockDashboardWriteOffDayPoint> writeOffRows
    ) {
        Map<String, long[]> byDay = new HashMap<>();

        if (receivedRows != null) {
            for (Object[] row : receivedRows) {
                String day = row[0].toString();
                long received = ((Number) row[1]).longValue();
                byDay.put(day, new long[] { received, 0, 0 });
            }
        }

        if (soldRows != null) {
            for (Object[] row : soldRows) {
                String day = row[0].toString();
                long sold = ((Number) row[1]).longValue();
                byDay.compute(day, (key, values) -> {
                    if (values == null) {
                        return new long[] { 0, sold, 0 };
                    }
                    values[1] = sold;
                    return values;
                });
            }
        }

        if (writeOffRows != null) {
            for (StockDashboardWriteOffDayPoint point : writeOffRows) {
                byDay.compute(point.date(), (key, values) -> {
                    if (values == null) {
                        return new long[] { 0, 0, point.writeOffUnits() };
                    }
                    values[2] = point.writeOffUnits();
                    return values;
                });
            }
        }

        List<StockDashboardDayPoint> result = new ArrayList<>();
        for (LocalDate date = from; !date.isAfter(to); date = date.plusDays(1)) {
            String key = date.toString();
            long[] values = byDay.getOrDefault(key, new long[] { 0, 0, 0 });
            result.add(new StockDashboardDayPoint(key, values[0], values[1], values[2]));
        }
        return result;
    }
}
