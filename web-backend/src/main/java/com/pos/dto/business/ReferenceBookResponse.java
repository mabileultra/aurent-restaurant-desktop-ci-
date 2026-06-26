package com.pos.dto.business;

import java.util.List;

public record ReferenceBookResponse(
    Integer id,
    String code,
    String name,
    String description,
    boolean active,
    int entriesCount
) {}
