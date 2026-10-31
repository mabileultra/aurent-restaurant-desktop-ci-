package com.pos.restaurant.report.dto;

import com.pos.shared.api.PageResponse;

import java.util.List;

/**
 * Journal page uses platform {@link PageResponse} field names ({@code content}/{@code number})
 * plus filter-wide {@code totals}.
 */
public record ReceiptJournalResponse(
    List<ReceiptJournalRow> content,
    int totalPages,
    long totalElements,
    int size,
    int number,
    ReceiptJournalTotals totals
) {
    public static ReceiptJournalResponse of(PageResponse<ReceiptJournalRow> page, ReceiptJournalTotals totals) {
        return new ReceiptJournalResponse(
            page.content(),
            page.totalPages(),
            page.totalElements(),
            page.size(),
            page.number(),
            totals
        );
    }
}
