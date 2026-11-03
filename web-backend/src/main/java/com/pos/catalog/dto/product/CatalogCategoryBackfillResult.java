package com.pos.catalog.dto.product;

public record CatalogCategoryBackfillResult(
    Integer companyId,
    int processed,
    int succeeded,
    int failed,
    int skipped
) {
}
