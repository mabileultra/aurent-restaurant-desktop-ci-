package com.pos.restaurant.report.dto;

import java.util.List;

public record SalesSummaryResponse(
    ReceiptJournalTotals totals,
    List<SalesBreakdownRow> byMethod,
    List<SalesBreakdownRow> byCardType,
    List<SalesBreakdownRow> byChannel,
    List<SalesBreakdownRow> byHall,
    List<SalesBreakdownRow> byHour,
    List<SalesBreakdownRow> byDay
) {
}
