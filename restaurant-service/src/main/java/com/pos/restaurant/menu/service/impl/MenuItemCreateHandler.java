package com.pos.restaurant.menu.service.impl;

import com.pos.restaurant.floor.support.FloorTenantSupport;
import com.pos.restaurant.kitchen.support.KitchenStationLookup;
import com.pos.restaurant.menu.domain.MenuItemType;
import com.pos.restaurant.menu.domain.MenuPortionUnit;
import com.pos.restaurant.menu.dto.MenuItemResponse;
import com.pos.restaurant.menu.dto.SaveMenuItemRequest;
import com.pos.restaurant.menu.entity.MenuItem;
import com.pos.restaurant.modifier.support.MenuItemModifierBinder;
import com.pos.restaurant.menu.mapper.MenuItemMapper;
import com.pos.restaurant.menu.repository.MenuItemRepository;
import com.pos.restaurant.menu.support.MenuCategoryLookup;
import com.pos.restaurant.menu.support.MenuPortionFormat;
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
    private final MenuCategoryLookup categoryLookup;
    private final MenuItemModifierBinder modifierBinder;

    @Transactional
    public MenuItemResponse handle(Integer storeId, SaveMenuItemRequest request) {
        Integer companyId = tenantSupport.requireCompanyId();
        MenuCategoryLookup.Resolved category = categoryLookup.resolveOptional(
            request.menuCategoryId(), companyId, storeId
        );
        MenuItem saved = itemRepository.save(MenuItem.builder()
            .companyId(companyId)
            .storeId(storeId)
            .itemType(request.itemType() == null ? MenuItemType.DISH : request.itemType())
            .name(request.name().trim())
            .sku(blankToNull(request.sku()))
            .price(scalePrice(request.price()))
            .taxRate(scaleTax(request.taxRate()))
            .available(request.available() == null || request.available())
            .sortOrder(request.sortOrder() == null ? 100 : request.sortOrder())
            .stationId(stationLookup.resolveOptional(request.stationId(), companyId, storeId))
            .menuCategoryId(category.id())
            .category(category.name())
            .imageUrl(blankToNull(request.imageUrl()))
            .description(blankToNull(request.description()))
            .prepMinutes(normalizePrep(request.prepMinutes()))
            .portionAmount(resolvePortionAmount(request))
            .portionUnit(resolvePortionUnit(request))
            .portionGrams(MenuPortionFormat.gramsFromAmount(resolvePortionAmount(request), resolvePortionUnit(request)))
            .portionLabel(blankToNull(request.portionLabel()))
            .tags(normalizeTags(request.tags()))
            .active(true)
            .build());
        modifierBinder.replace(saved.getId(), companyId, storeId, request.modifierGroupIds());
        LogUtil.info(MenuItemCreateHandler.class, "Menu item created: id={}, storeId={}", saved.getId(), storeId);
        return itemMapper.toResponse(saved);
    }

    private static BigDecimal scalePrice(BigDecimal price) {
        return price.setScale(2, RoundingMode.HALF_UP);
    }

    private static BigDecimal scaleTax(BigDecimal taxRate) {
        if (taxRate == null) {
            return BigDecimal.ZERO.setScale(2, RoundingMode.HALF_UP);
        }
        return taxRate.setScale(2, RoundingMode.HALF_UP);
    }

    private static String blankToNull(String value) {
        if (value == null || value.isBlank()) {
            return null;
        }
        return value.trim();
    }

    private static Integer normalizePrep(Integer value) {
        if (value == null || value < 0) {
            return null;
        }
        return value;
    }

    private static BigDecimal resolvePortionAmount(SaveMenuItemRequest request) {
        BigDecimal amount = normalizePortionAmount(request.portionAmount());
        if (amount != null) {
            return amount;
        }
        if (request.portionGrams() != null && request.portionGrams() > 0) {
            return BigDecimal.valueOf(request.portionGrams());
        }
        return null;
    }

    private static MenuPortionUnit resolvePortionUnit(SaveMenuItemRequest request) {
        BigDecimal amount = normalizePortionAmount(request.portionAmount());
        if (amount != null) {
            return request.portionUnit() == null ? MenuPortionUnit.PORTION : request.portionUnit();
        }
        if (request.portionGrams() != null && request.portionGrams() > 0) {
            return MenuPortionUnit.G;
        }
        return null;
    }

    private static BigDecimal normalizePortionAmount(BigDecimal value) {
        if (value == null || value.signum() <= 0) {
            return null;
        }
        return value.setScale(3, RoundingMode.HALF_UP);
    }

    private static String normalizeTags(String value) {
        String trimmed = blankToNull(value);
        if (trimmed == null) {
            return null;
        }
        String[] parts = trimmed.toUpperCase().split("[,;\\s]+");
        StringBuilder out = new StringBuilder();
        for (String part : parts) {
            if (part.isBlank()) continue;
            if (out.length() > 0) out.append(',');
            out.append(part);
        }
        return out.length() == 0 ? null : out.toString();
    }
}
