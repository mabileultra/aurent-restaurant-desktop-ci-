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
            base.taxRate(),
            base.active(),
            base.available(),
            base.sortOrder(),
            base.stationId(),
            base.menuCategoryId(),
            base.category(),
            listSafeImageUrl(base.id(), base.imageUrl()),
            base.description(),
            base.prepMinutes(),
            base.portionGrams(),
            base.portionAmount(),
            base.portionUnit(),
            base.portionLabel(),
            base.variantGroupId(),
            base.tags(),
            groupIds == null ? List.of() : List.copyOf(groupIds),
            base.ikpu(),
            base.packageCode(),
            base.unitOfMeasure(),
            base.unitMeasureCode(),
            base.barcode(),
            base.markedProduct()
        );
    }

    /**
     * Inline data-URI photos blow list payloads to multi‑MB (POS hangs / gateway 500).
     * Replace them with a light ref; POS loads bytes from GET /rst/menu-items/{id}/image.
     */
    static String listSafeImageUrl(java.util.UUID itemId, String imageUrl) {
        if (imageUrl == null || imageUrl.isBlank()) {
            return null;
        }
        String trimmed = imageUrl.trim();
        if (trimmed.regionMatches(true, 0, "data:", 0, 5)) {
            return itemId == null ? null : MenuItemImageRef.forItem(itemId);
        }
        return trimmed;
    }
}
