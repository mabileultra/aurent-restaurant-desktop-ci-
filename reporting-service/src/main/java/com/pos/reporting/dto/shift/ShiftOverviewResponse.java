package com.pos.reporting.dto.shift;

import java.math.BigDecimal;
import java.util.List;

public record ShiftOverviewResponse(
    long periodCount,
    BigDecimal periodTotalAmount,
    long totalInSystem,
    List<ShiftReportRowResponse> recentReports
) {
}
