package com.pos.dto.report;

import java.math.BigDecimal;

public record ReturnsSummaryResponse(
    long returnsCount,
    BigDecimal returnsAmount
) {
}
