package com.pos.client.catalog;

import java.util.UUID;

public record CatalogCategoryUpsertRequest(
    UUID id,
    Integer companyId,
    String name,
    Boolean active,
    Integer sortOrder
) {
}
