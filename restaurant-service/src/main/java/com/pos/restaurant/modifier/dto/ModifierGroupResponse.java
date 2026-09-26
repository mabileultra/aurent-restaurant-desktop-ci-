package com.pos.restaurant.modifier.dto;

import com.pos.restaurant.modifier.domain.ModifierGroupKind;

import java.util.List;
import java.util.UUID;

public record ModifierGroupResponse(
    UUID id,
    Integer storeId,
    String name,
    ModifierGroupKind groupKind,
    int minSelect,
    int maxSelect,
    int sortOrder,
    boolean availableForAll,
    boolean active,
    List<ModifierOptionResponse> options
) {}
