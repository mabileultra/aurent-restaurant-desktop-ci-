package com.pos.restaurant.menu.service.impl;

import com.pos.restaurant.floor.support.FloorTenantSupport;
import com.pos.restaurant.kitchen.support.KitchenStationLookup;
import com.pos.restaurant.menu.domain.MenuItemType;
import com.pos.restaurant.menu.dto.MenuItemResponse;
import com.pos.restaurant.menu.dto.SaveMenuItemRequest;
import com.pos.restaurant.menu.entity.MenuItem;
import com.pos.restaurant.modifier.support.MenuItemModifierBinder;
import com.pos.restaurant.menu.mapper.MenuItemMapper;
import com.pos.restaurant.menu.repository.MenuItemRepository;
import com.pos.shared.log.LogUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;

@Component
@RequiredArgsConstructor
public class MenuItemCreateHandler {

    private final MenuItemRepository itemRepository;
    private final MenuItemMapper itemMapper;
    private final FloorTenantSupport tenantSupport;
    private final KitchenStationLookup stationLookup;
    private final MenuItemModifierBinder modifierBinder;

    @Transactional
    public MenuItemResponse handle(Integer storeId, SaveMenuItemRequest request) {
        Integer companyId = tenantSupport.requireCompanyId();
        MenuItem saved = itemRepository.save(MenuItem.builder()
            .companyId(companyId)
            .storeId(storeId)
            .itemType(request.itemType() == null ? MenuItemType.DISH : request.itemType())
            .name(request.name().trim())
            .sku(blankToNull(request.sku()))
            .price(scalePrice(request.price()))
            .available(request.available() == null || request.available())
            .sortOrder(request.sortOrder() == null ? 100 : request.sortOrder())
            .stationId(stationLookup.resolveOptional(request.stationId(), companyId, storeId))
            .category(blankToNull(request.category()))
            .imageUrl(blankToNull(request.imageUrl()))
            .active(true)
            .build());
        modifierBinder.replace(saved.getId(), companyId, storeId, request.modifierGroupIds());
        LogUtil.info(MenuItemCreateHandler.class, "Menu item created: id={}, storeId={}", saved.getId(), storeId);
        return itemMapper.toResponse(saved);
    }

    private static BigDecimal scalePrice(BigDecimal price) {
        return price.setScale(2, RoundingMode.HALF_UP);
    }

    private static String blankToNull(String value) {
        if (value == null || value.isBlank()) {
            return null;
        }
        return value.trim();
    }
}
