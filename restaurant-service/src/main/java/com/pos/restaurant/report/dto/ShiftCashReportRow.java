package com.pos.restaurant.report.dto;

import com.pos.restaurant.shift.domain.RestaurantShiftStatus;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

public record ShiftCashReportRow(
    UUID shiftId,
    RestaurantShiftStatus status,
    Instant openedAt,
    Instant closedAt,
    UUID openedByUserId,
    UUID closedByUserId,
    BigDecimal openingCash,
    BigDecimal cashSales,
    BigDecimal cashIn,
    BigDecimal cashOut,
    BigDecimal collection,
    BigDecimal expectedCash,
    BigDecimal closingCash,
    BigDecimal difference,
    BigDecimal handoverExpected,
    BigDecimal handoverDiff
) {
}
