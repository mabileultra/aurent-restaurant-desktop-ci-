package com.pos.dto.business;

import java.util.List;

public record ReferenceBookDetailResponse(
    Integer id,
    String code,
    String name,
    String description,
    boolean active,
    List<ReferenceBookEntryResponse> entries
) {}
