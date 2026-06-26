package com.pos.reporting.dto;

public record TopProductRowResponse(
    String productName,
    long quantitySold
) {
}
