package com.pos.restaurant.shift.support;

import com.pos.restaurant.shift.dto.ShiftItemRow;
import com.pos.restaurant.shift.dto.ShiftReportResponse;
import com.pos.restaurant.shift.entity.RestaurantShift;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;

@Component
public class ShiftReportAssembler {

    public ShiftReportResponse toReport(
        String reportType,
        RestaurantShift shift,
        String storeName,
        String cashierName,
        Instant reportAt,
        int returnsCount,
        List<ShiftItemRow> items
    ) {
        return toReport(reportType, shift, storeName, cashierName, reportAt, returnsCount, items, ShiftCashMath.Drawer.zero());
    }

    public ShiftReportResponse toReport(
        String reportType,
        RestaurantShift shift,
        String storeName,
        String cashierName,
        Instant reportAt,
        int returnsCount,
        List<ShiftItemRow> items,
        ShiftCashMath.Drawer drawer
    ) {
        BigDecimal zero = BigDecimal.ZERO.setScale(2);
        return new ShiftReportResponse(
            reportType,
            shift.getId(),
            shift.getStoreId(),
            storeName,
            cashierName,
            shift.getOpenedAt(),
            reportAt,
            shift.getSaleCount(),
            nz(shift.getTotalAmount()),
            nz(shift.getCashAmount()),
            nz(shift.getCardAmount()),
            zero,
            zero,
            zero,
            zero,
            zero,
            zero,
            zero,
            nz(shift.getOpeningCash()),
            shift.getClosingCash() == null ? zero : nz(shift.getClosingCash()),
            Math.max(0, returnsCount),
            zero,
            zero,
            zero,
            zero,
            zero,
            zero,
            ShiftCashMath.expected(shift.getOpeningCash(), shift.getCashAmount(), drawer),
            items == null ? List.of() : items
        );
    }

    private static BigDecimal nz(BigDecimal value) {
        return value == null ? BigDecimal.ZERO.setScale(2) : value;
    }
}
