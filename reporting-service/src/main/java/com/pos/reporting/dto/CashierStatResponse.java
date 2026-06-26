package com.pos.reporting.dto;

import java.math.BigDecimal;

public record CashierStatResponse(
    String cashierName,
    BigDecimal revenue
) {
}
