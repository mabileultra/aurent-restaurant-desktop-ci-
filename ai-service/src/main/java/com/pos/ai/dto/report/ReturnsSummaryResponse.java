package com.pos.ai.dto.report;

import java.math.BigDecimal;

public record ReturnsSummaryResponse(
    long returnsCount,
    BigDecimal returnsAmount
) {
}
