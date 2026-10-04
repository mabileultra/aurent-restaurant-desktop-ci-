package com.pos.pharmacy.shift.support;

import com.pos.pharmacy.shift.dto.ShiftItemRow;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.List;

final class PharmacyShiftSoldItemsRows {

    private PharmacyShiftSoldItemsRows() {}

    static List<ShiftItemRow> map(List<Object[]> raw) {
        if (raw == null || raw.isEmpty()) {
            return List.of();
        }
        return raw.stream()
            .map(PharmacyShiftSoldItemsRows::unwrap)
            .map(row -> new ShiftItemRow(
                row[0] == null ? "" : row[0].toString(),
                scale(row[1], 3),
                scale(row[2], 2)
            ))
            .toList();
    }

    private static Object[] unwrap(Object[] raw) {
        if (raw != null && raw.length == 1 && raw[0] instanceof Object[] nested) {
            return nested;
        }
        return raw;
    }

    private static BigDecimal scale(Object value, int digits) {
        if (value instanceof BigDecimal bd) {
            return bd.setScale(digits, RoundingMode.HALF_UP);
        }
        if (value instanceof Number n) {
            return BigDecimal.valueOf(n.doubleValue()).setScale(digits, RoundingMode.HALF_UP);
        }
        return BigDecimal.ZERO.setScale(digits);
    }
}
