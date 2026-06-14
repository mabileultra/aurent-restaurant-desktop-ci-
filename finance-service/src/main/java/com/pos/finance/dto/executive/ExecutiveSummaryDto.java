package com.pos.finance.dto.executive;

import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.List;

public record ExecutiveSummaryDto(
    ExecutivePeriod period,
    BigDecimal salesAmount,
    long salesCount,
    BigDecimal revenueToday,
    BigDecimal expensesToday,
    BigDecimal netProfitToday,
    BigDecimal revenuePeriod,
    BigDecimal expensesPeriod,
    BigDecimal netProfitPeriod,
    BigDecimal cashTotal,
    BigDecimal bankTotal,
    BigDecimal moneyTotal,
    BigDecimal customerDebtTotal,
    BigDecimal supplierDebtTotal,
    ExecutiveComparisonDto vsPrevious,
    List<ExecutiveChartDayDto> chart,
    BigDecimal expensesTodayTotal,
    List<ExecutiveExpenseItemDto> topExpenses,
    BigDecimal periodSalesAmount,
    long periodSalesCount,
    BigDecimal averageCheck,
    ExecutivePreviousPeriodDto previousPeriod,
    OffsetDateTime updatedAt
) {
}
