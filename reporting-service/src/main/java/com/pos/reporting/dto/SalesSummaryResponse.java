package com.pos.reporting.dto;

import java.math.BigDecimal;

public record SalesSummaryResponse(
    Integer companyId,
    String from,
    String to,
    long salesCount,
    BigDecimal totalAmount
) {}
