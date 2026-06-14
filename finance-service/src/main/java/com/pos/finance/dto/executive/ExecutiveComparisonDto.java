package com.pos.finance.dto.executive;

import java.math.BigDecimal;

public record ExecutiveComparisonDto(
    BigDecimal salesPercent,
    BigDecimal profitPercent,
    BigDecimal expensesPercent
) {
}
