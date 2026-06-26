package com.pos.reporting.dto.shift;

import java.math.BigDecimal;
import java.time.Instant;

public record ShiftReportRowResponse(
    Long zReportId,
    Integer zNumber,
    Integer storeId,
    String storeName,
    Instant closedAt,
    BigDecimal totalAmount,
    Integer salesCount,
    String employeeName
) {
}
