package com.pos.finance.dto.executive;

import java.math.BigDecimal;

public record ExecutiveExpenseItemDto(
    String categoryName,
    BigDecimal amount
) {
}
