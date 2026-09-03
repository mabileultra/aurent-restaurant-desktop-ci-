package com.pos.restaurant.menu.service.impl;

import com.pos.restaurant.kitchen.support.KitchenStationLookup;
import com.pos.restaurant.modifier.support.MenuItemModifierBinder;
import com.pos.restaurant.exception.NotFoundException;
import com.pos.restaurant.floor.support.FloorTenantSupport;
import com.pos.restaurant.menu.domain.MenuItemType;
import com.pos.restaurant.menu.dto.MenuItemResponse;
import com.pos.restaurant.menu.dto.SaveMenuItemRequest;
import com.pos.restaurant.menu.entity.MenuItem;
import com.pos.restaurant.menu.mapper.MenuItemMapper;
import com.pos.restaurant.menu.repository.MenuItemRepository;
import com.pos.shared.log.LogUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.math.RoundingMode;
import java.util.UUID;

@Component
@RequiredArgsConstructor
public class MenuItemUpdateHandler {

    private final MenuItemRepository itemRepository;
    private final MenuItemMapper itemMapper;
    private final FloorTenantSupport tenantSupport;
    private final KitchenStationLookup stationLookup;
    private final MenuItemModifierBinder modifierBinder;

    @Transactional
    public MenuItemResponse handle(UUID itemId, SaveMenuItemRequest request) {
        Integer companyId = tenantSupport.requireCompanyId();
        MenuItem item = itemRepository.findByIdAndCompanyId(itemId, companyId)
            .orElseThrow(() -> new NotFoundException("Menu item not found: " + itemId));
        item.setName(request.name().trim());
        item.setSku(blankToNull(request.sku()));
        item.setPrice(request.price().setScale(2, RoundingMode.HALF_UP));
        if (request.itemType() != null) {
            item.setItemType(request.itemType());
        }
        if (request.available() != null) {
            item.setAvailable(request.available());
        }
        if (request.sortOrder() != null) {
            item.setSortOrder(request.sortOrder());
        }
        item.setStationId(stationLookup.resolveOptional(request.stationId(), companyId, item.getStoreId()));
        modifierBinder.replace(itemId, companyId, item.getStoreId(), request.modifierGroupIds());
        LogUtil.info(MenuItemUpdateHandler.class, "Menu item updated: id={}", itemId);
        return itemMapper.toResponse(item);
    }

    private static String blankToNull(String value) {
        if (value == null || value.isBlank()) {
            return null;
        }
        return value.trim();
    }
}
