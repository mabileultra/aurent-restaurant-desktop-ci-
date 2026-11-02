package com.pos.catalog.dto;

public record CatalogStatsResponse(
    Integer companyId,
    long total,
    long active,
    long inactive
) {
}
