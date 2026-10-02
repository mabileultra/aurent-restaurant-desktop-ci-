package com.pos.restaurant.report.dto;

import java.util.List;

public record ShiftCashReportResponse(
    List<ShiftCashReportRow> rows,
    ShiftCashReportTotals totals
) {
}
