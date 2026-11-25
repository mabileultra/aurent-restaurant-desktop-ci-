package com.pos.dto.tenant;

/**
 * Per-store receipt header overrides (name / address / phone / STIR).
 * Company-level logo and field toggles stay shared.
 */
public record StoreReceiptProfilePayload(
    String receiptCompanyName,
    String receiptCompanyAddress,
    String receiptCompanyPhone,
    String receiptStir
) {}
