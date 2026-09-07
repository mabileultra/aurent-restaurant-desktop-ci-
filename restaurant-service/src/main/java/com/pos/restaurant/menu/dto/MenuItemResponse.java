package com.pos.restaurant.menu.dto;

import com.pos.restaurant.menu.domain.MenuItemType;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

public record MenuItemResponse(
    UUID id,
    Integer storeId,
    MenuItemType itemType,
    String name,
    String sku,
    BigDecimal price,
    boolean active,
    boolean available,
    int sortOrder,
    UUID stationId,
    String category,
    String imageUrl,
    String description,
    Integer prepMinutes,
    String tags,
    List<UUID> modifierGroupIds
) {}
