package com.pos.integrations.marking.dto;

public record MarkSoldCheckResponse(
    boolean sold,
    String status,
    String receiptNumber
) {}
