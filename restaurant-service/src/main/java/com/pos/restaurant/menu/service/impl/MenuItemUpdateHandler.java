package com.pos.restaurant.menu.service.impl;

import com.pos.restaurant.kitchen.support.KitchenStationLookup;
import com.pos.restaurant.modifier.support.MenuItemModifierBinder;
import com.pos.restaurant.exception.NotFoundException;
import com.pos.restaurant.floor.support.FloorTenantSupport;
import com.pos.restaurant.menu.domain.MenuItemType;
import com.pos.restaurant.menu.domain.MenuPortionUnit;
import com.pos.restaurant.menu.dto.MenuItemResponse;
import com.pos.restaurant.menu.dto.SaveMenuItemRequest;
import com.pos.restaurant.menu.entity.MenuItem;
import com.pos.restaurant.menu.mapper.MenuItemMapper;
import com.pos.restaurant.menu.repository.MenuItemRepository;
import com.pos.restaurant.menu.support.MenuCategoryLookup;
import com.pos.restaurant.menu.support.MenuItemFiscalApplier;
import com.pos.restaurant.menu.support.MenuPortionFormat;
import com.pos.shared.log.LogUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.UUID;

@Component
@RequiredArgsConstructor
public class MenuItemUpdateHandler {

    private final MenuItemRepository itemRepository;
    private final MenuItemMapper itemMapper;
    private final FloorTenantSupport tenantSupport;
    private final KitchenStationLookup stationLookup;
    private final MenuCategoryLookup categoryLookup;
    private final MenuItemModifierBinder modifierBinder;
    private final MenuItemFiscalApplier fiscalApplier;

    @Transactional
    public MenuItemResponse handle(UUID itemId, SaveMenuItemRequest request) {
        Integer companyId = tenantSupport.requireCompanyId();
        MenuItem item = itemRepository.findByIdAndCompanyId(itemId, companyId)
            .orElseThrow(() -> new NotFoundException("Menu item not found: " + itemId));
        item.setName(request.name().trim());
        item.setSku(blankToNull(request.sku()));
        item.setPrice(request.price().setScale(2, RoundingMode.HALF_UP));
        item.setTaxRate(request.taxRate() == null
            ? BigDecimal.ZERO.setScale(2, RoundingMode.HALF_UP)
            : request.taxRate().setScale(2, RoundingMode.HALF_UP));
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
        MenuCategoryLookup.Resolved category = categoryLookup.resolveOptional(
            request.menuCategoryId(), companyId, item.getStoreId()
        );
        item.setMenuCategoryId(category.id());
        item.setCategory(category.name());
        item.setImageUrl(blankToNull(request.imageUrl()));
        item.setDescription(blankToNull(request.description()));
        item.setPrepMinutes(normalizePrep(request.prepMinutes()));
        BigDecimal portionAmount = resolvePortionAmount(request);
        MenuPortionUnit portionUnit = resolvePortionUnit(request);
        MenuPortionFormat.requireWeightWithinLimit(portionAmount, portionUnit);
        item.setPortionAmount(portionAmount);
        item.setPortionUnit(portionUnit);
        item.setPortionGrams(MenuPortionFormat.gramsFromAmount(portionAmount, portionUnit));
        item.setPortionLabel(blankToNull(request.portionLabel()));
        item.setTags(normalizeTags(request.tags()));
        fiscalApplier.apply(item, request);
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
        return MenuPortionFormat.normalizeAmount(value);
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
