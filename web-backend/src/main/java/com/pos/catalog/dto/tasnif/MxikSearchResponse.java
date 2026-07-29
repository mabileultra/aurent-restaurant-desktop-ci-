package com.pos.catalog.dto.tasnif;

import java.util.List;

public record MxikSearchResponse(
    List<MxikCatalogItemDto> items,
    int page,
    int size,
    long total
) {}
