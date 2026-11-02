package com.pos.catalog.dto.product;

public record CatalogServiceBackfillResult(
    int page,
    int size,
    int processed,
    int succeeded,
    int failed,
    int skipped,
    long totalElements,
    int totalPages,
    boolean catalogEnabled
) {
}
