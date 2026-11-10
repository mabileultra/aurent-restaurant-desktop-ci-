package com.pos.taxanalytics.dto;

public record TaxAnalyticsReceiptCountsResponse(
    String period,
    String from,
    String to,
    String regionCode,
    String districtCode,
    String businessType,
    long fiscalReceiptCount,
    long nonFiscalReceiptCount,
    long totalReceiptCount
) {
}
