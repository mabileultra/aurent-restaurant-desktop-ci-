package com.pos.catalog.dto;

public record CatalogOutboxStatsResponse(
    long pending,
    long published,
    long failed
) {
}
