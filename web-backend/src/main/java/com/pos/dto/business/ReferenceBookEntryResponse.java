package com.pos.dto.business;

import java.util.List;

public record ReferenceBookEntryResponse(
    Integer id,
    String value,
    String label,
    int sortOrder
) {}
