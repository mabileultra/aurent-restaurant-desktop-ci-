package com.pos.restaurant.analytics.support;

import com.pos.restaurant.analytics.dto.DishSalesRow;
import com.pos.restaurant.analytics.dto.HourSalesRow;

import java.math.BigDecimal;
import java.util.List;

public final class DashboardSalesRowMapper {

    private DashboardSalesRowMapper() {
    }

    public static List<DishSalesRow> dishes(List<Object[]> raw) {
        return raw.stream()
            .map(row -> new DishSalesRow(
                String.valueOf(row[0]),
                toDecimal(row[1]),
                toDecimal(row[2])
            ))
            .toList();
    }

    public static List<HourSalesRow> hours(List<Object[]> raw) {
        return raw.stream()
            .map(row -> new HourSalesRow(
                ((Number) row[0]).intValue(),
                ((Number) row[1]).longValue(),
                toDecimal(row[2])
            ))
            .toList();
    }

    public static BigDecimal toDecimal(Object value) {
        if (value == null) {
            return BigDecimal.ZERO;
        }
        if (value instanceof BigDecimal decimal) {
            return decimal;
        }
        return new BigDecimal(value.toString());
    }
}
