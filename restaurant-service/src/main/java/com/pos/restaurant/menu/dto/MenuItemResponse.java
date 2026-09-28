package com.pos.restaurant.menu.dto;

import com.pos.restaurant.menu.domain.MenuItemType;
import com.pos.restaurant.menu.domain.MenuPortionUnit;

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
    BigDecimal taxRate,
    boolean active,
    boolean available,
    int sortOrder,
    UUID stationId,
    UUID menuCategoryId,
    String category,
    String imageUrl,
    String description,
    Integer prepMinutes,
    Integer portionGrams,
    BigDecimal portionAmount,
    MenuPortionUnit portionUnit,
    String portionLabel,
    UUID variantGroupId,
    String tags,
    List<UUID> modifierGroupIds
) {}
