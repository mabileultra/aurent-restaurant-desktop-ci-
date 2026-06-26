package com.pos.reporting.dto;

import java.math.BigDecimal;

public record ReturnsSummaryResponse(
    long returnsCount,
    BigDecimal returnsAmount
) {
}
