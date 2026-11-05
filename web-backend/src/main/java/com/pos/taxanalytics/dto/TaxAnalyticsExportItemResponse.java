package com.pos.taxanalytics.dto;

public record TaxAnalyticsExportItemResponse(
    String id,
    String createdAt,
    String periodFrom,
    String periodTo,
    String filename
) {
}
