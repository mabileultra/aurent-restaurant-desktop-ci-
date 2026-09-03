package com.pos.restaurant.modifier.dto;

import java.util.List;
import java.util.UUID;

public record ModifierGroupResponse(
    UUID id,
    Integer storeId,
    String name,
    int minSelect,
    int maxSelect,
    int sortOrder,
    boolean active,
    List<ModifierOptionResponse> options
) {}
