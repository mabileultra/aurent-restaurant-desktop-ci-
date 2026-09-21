package com.pos.reporting.dto;

import java.math.BigDecimal;

public record TopProductRowResponse(
    String productName,
    long quantitySold,
    BigDecimal revenue
) {
}
