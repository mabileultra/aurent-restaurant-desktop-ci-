package com.pos.finance.dto.executive;

import java.math.BigDecimal;
import java.time.LocalDate;

public record ExecutiveChartDayDto(
    LocalDate date,
    BigDecimal income,
    BigDecimal expense,
    BigDecimal netProfit
) {
}
