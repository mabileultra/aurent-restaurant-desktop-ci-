package com.pos.ai.dto.report.shift;

import java.math.BigDecimal;
import java.util.List;

public record ShiftOverviewResponse(
    long periodCount,
    BigDecimal periodTotalAmount,
    long totalInSystem,
    List<ShiftReportRowResponse> recentReports
) {
}
