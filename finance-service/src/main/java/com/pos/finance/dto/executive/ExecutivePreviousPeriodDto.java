package com.pos.finance.dto.executive;

import java.math.BigDecimal;

public record ExecutivePreviousPeriodDto(
    BigDecimal revenue,
    BigDecimal expenses,
    BigDecimal netProfit,
    BigDecimal salesAmount,
    long salesCount
) {
}
