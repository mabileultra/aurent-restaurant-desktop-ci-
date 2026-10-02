package com.pos.restaurant.report.dto;

import java.util.List;

public record ReceiptJournalResponse(
    List<ReceiptJournalRow> rows,
    int page,
    int size,
    long totalElements,
    ReceiptJournalTotals totals
) {
}
