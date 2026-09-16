package com.pos.pharmacy.sync.dto;

import com.pos.pharmacy.catalog.dto.ProductResponse;

import java.time.Instant;
import java.util.List;

public record PharmacySyncBootstrapResponse(
    Integer storeId,
    String storeName,
    List<PharmacySyncCategoryDto> categories,
    List<ProductResponse> products,
    Instant syncedAt
) {}
