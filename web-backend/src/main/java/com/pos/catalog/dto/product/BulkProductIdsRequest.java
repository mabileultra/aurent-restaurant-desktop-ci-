package com.pos.catalog.dto.product;

import jakarta.validation.constraints.NotEmpty;

import java.util.List;
import java.util.UUID;

public record BulkProductIdsRequest(
    @NotEmpty List<UUID> productIds,
    /** When set — remove from this store assortment only; otherwise company-wide deactivate. */
    Integer storeId
) {}
