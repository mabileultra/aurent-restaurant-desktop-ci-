package com.pos.restaurant.menu.support;

import com.pos.restaurant.menu.dto.MenuItemResponse;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.UUID;

@Component
public class MenuItemResponseFactory {

    public MenuItemResponse withGroups(MenuItemResponse base, List<UUID> groupIds) {
        return new MenuItemResponse(
            base.id(),
            base.storeId(),
            base.itemType(),
            base.name(),
            base.sku(),
            base.price(),
            base.active(),
            base.available(),
            base.sortOrder(),
            base.stationId(),
            base.menuCategoryId(),
            base.category(),
            base.imageUrl(),
            base.description(),
            base.prepMinutes(),
            base.portionGrams(),
            base.portionAmount(),
            base.portionUnit(),
            base.portionLabel(),
            base.variantGroupId(),
            base.tags(),
            groupIds == null ? List.of() : List.copyOf(groupIds)
        );
    }
}
