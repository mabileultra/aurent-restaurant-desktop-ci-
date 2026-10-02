package com.pos.restaurant.report.dto;

import java.math.BigDecimal;

/** Sums over every check matching the filter, not just the current page. */
public record ReceiptJournalTotals(
    long checkCount,
    long guestCount,
    BigDecimal totalAmount,
    BigDecimal cashAmount,
    BigDecimal cardAmount,
    BigDecimal creditAmount,
    BigDecimal advanceAmount,
    BigDecimal debtRemaining,
    BigDecimal discountAmount,
    BigDecimal serviceAmount,
    BigDecimal refundAmount,
    BigDecimal netAmount,
    BigDecimal averageCheck
) {
}
