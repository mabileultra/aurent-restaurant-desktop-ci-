package com.pos.pharmacy.sales.dto;

public record MarkSoldCheckResponse(
    boolean sold,
    String status,
    String receiptNumber
) {}
