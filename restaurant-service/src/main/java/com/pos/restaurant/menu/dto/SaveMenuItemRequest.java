package com.pos.restaurant.menu.dto;

import com.pos.restaurant.menu.domain.MenuItemType;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

public record SaveMenuItemRequest(
    @NotBlank String name,
    String sku,
    @NotNull @DecimalMin("0") BigDecimal price,
    MenuItemType itemType,
    Boolean available,
    @Min(0) Integer sortOrder,
    UUID stationId,
    @Size(max = 80) String category,
    String imageUrl,
    List<UUID> modifierGroupIds
) {}
