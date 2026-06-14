package com.pos.finance.dto.income;

import java.math.BigDecimal;
import java.time.LocalDate;

public record DailyRevenueSummaryDto(
    LocalDate date,
    Integer storeId,
    BigDecimal totalAmount,
    BigDecimal cashAmount,
    BigDecimal cardAmount,
    long zReportCount
) {
}
