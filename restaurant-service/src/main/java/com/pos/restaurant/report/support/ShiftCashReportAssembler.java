package com.pos.restaurant.report.support;

import com.pos.restaurant.report.dto.ShiftCashReportRow;
import com.pos.restaurant.report.dto.ShiftCashReportTotals;
import com.pos.restaurant.shift.entity.RestaurantShift;
import com.pos.restaurant.shift.support.ShiftCashMath;

import java.math.BigDecimal;
import java.util.List;

public final class ShiftCashReportAssembler {

    private ShiftCashReportAssembler() {
    }

    public static ShiftCashReportRow toRow(RestaurantShift shift, ShiftCashMath.Drawer drawer) {
        ShiftCashMath.Drawer safe = drawer == null ? ShiftCashMath.Drawer.zero() : drawer;
        BigDecimal expected = ShiftCashMath.expected(shift.getOpeningCash(), shift.getCashAmount(), safe);
        return new ShiftCashReportRow(
            shift.getId(),
            shift.getStatus(),
            shift.getOpenedAt(),
            shift.getClosedAt(),
            shift.getOpenedByUserId(),
            shift.getClosedByUserId(),
            ShiftCashMath.money(shift.getOpeningCash()),
            ShiftCashMath.money(shift.getCashAmount()),
            safe.cashIn(),
            safe.cashOut(),
            safe.collection(),
            expected,
            shift.getClosingCash() == null ? null : ShiftCashMath.money(shift.getClosingCash()),
            ShiftCashMath.difference(shift.getClosingCash(), expected),
            shift.getHandoverExpected() == null ? null : ShiftCashMath.money(shift.getHandoverExpected()),
            shift.getHandoverDiff() == null ? null : ShiftCashMath.money(shift.getHandoverDiff())
        );
    }

    public static ShiftCashReportTotals totals(List<ShiftCashReportRow> rows) {
        BigDecimal opening = BigDecimal.ZERO.setScale(2);
        BigDecimal sales = BigDecimal.ZERO.setScale(2);
        BigDecimal in = BigDecimal.ZERO.setScale(2);
        BigDecimal out = BigDecimal.ZERO.setScale(2);
        BigDecimal collection = BigDecimal.ZERO.setScale(2);
        BigDecimal expected = BigDecimal.ZERO.setScale(2);
        BigDecimal closing = BigDecimal.ZERO.setScale(2);
        BigDecimal difference = BigDecimal.ZERO.setScale(2);
        BigDecimal handover = BigDecimal.ZERO.setScale(2);
        for (ShiftCashReportRow row : rows) {
            opening = opening.add(row.openingCash());
            sales = sales.add(row.cashSales());
            in = in.add(row.cashIn());
            out = out.add(row.cashOut());
            collection = collection.add(row.collection());
            expected = expected.add(row.expectedCash());
            if (row.closingCash() != null) {
                closing = closing.add(row.closingCash());
            }
            if (row.difference() != null) {
                difference = difference.add(row.difference());
            }
            if (row.handoverDiff() != null) {
                handover = handover.add(row.handoverDiff());
            }
        }
        return new ShiftCashReportTotals(
            rows.size(), opening, sales, in, out, collection, expected, closing, difference, handover
        );
    }
}
