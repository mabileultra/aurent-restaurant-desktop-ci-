package com.pos.catalog.dto.product;

import com.pos.dto.shared.PageResponse;

public record ProductLifecycleResponse(
    ProductLifecycleSummaryResponse summary,
    PageResponse<ProductLifecycleEventResponse> events
) {}
