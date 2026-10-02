package com.pos.restaurant.report.dto;

import java.math.BigDecimal;

public record ShiftCashReportTotals(
    long shiftCount,
    BigDecimal openingCash,
    BigDecimal cashSales,
    BigDecimal cashIn,
    BigDecimal cashOut,
    BigDecimal collection,
    BigDecimal expectedCash,
    BigDecimal closingCash,
    BigDecimal difference,
    BigDecimal handoverDiff
) {
}
