package com.pos.reporting.dto;

import java.math.BigDecimal;

public record CashierStatResponse(
    String cashierId,
    String cashierName,
    long transactionCount,
    BigDecimal revenue
) {
}
