package com.pos.restaurant.menu.service.impl;

import com.pos.restaurant.exception.NotFoundException;
import com.pos.restaurant.floor.support.FloorTenantSupport;
import com.pos.restaurant.menu.domain.MenuPortionUnit;
import com.pos.restaurant.menu.dto.CreateMenuVariantRequest;
import com.pos.restaurant.menu.dto.MenuItemResponse;
import com.pos.restaurant.menu.entity.MenuItem;
import com.pos.restaurant.menu.mapper.MenuItemMapper;
import com.pos.restaurant.menu.repository.MenuItemRepository;
import com.pos.restaurant.menu.support.MenuPortionFormat;
import com.pos.restaurant.modifier.entity.MenuItemModifierLink;
import com.pos.restaurant.modifier.repository.MenuItemModifierLinkRepository;
import com.pos.restaurant.modifier.support.MenuItemModifierBinder;
import com.pos.shared.log.LogUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.List;
import java.util.UUID;

@Component
@RequiredArgsConstructor
public class MenuItemCreateVariantHandler {

    private final MenuItemRepository itemRepository;
    private final MenuItemMapper itemMapper;
    private final FloorTenantSupport tenantSupport;
    private final MenuItemModifierLinkRepository linkRepository;
    private final MenuItemModifierBinder modifierBinder;

    @Transactional
    public MenuItemResponse handle(UUID sourceItemId, CreateMenuVariantRequest request) {
        Integer companyId = tenantSupport.requireCompanyId();
        MenuItem source = itemRepository.findByIdAndCompanyId(sourceItemId, companyId)
            .orElseThrow(() -> new NotFoundException("Menu item not found: " + sourceItemId));

        UUID groupId = source.getVariantGroupId();
        if (groupId == null) {
            groupId = UUID.randomUUID();
            source.setVariantGroupId(groupId);
            itemRepository.save(source);
        }

        BigDecimal portionAmount = normalizeAmount(request.portionAmount());
        MenuPortionUnit portionUnit = portionAmount == null
            ? null
            : (request.portionUnit() == null ? MenuPortionUnit.PORTION : request.portionUnit());
        MenuPortionFormat.requireWeightWithinLimit(portionAmount, portionUnit);
        String name = blankToNull(request.name());
        if (name == null) {
            name = source.getName();
        }

        MenuItem saved = itemRepository.save(MenuItem.builder()
            .companyId(source.getCompanyId())
            .storeId(source.getStoreId())
            .itemType(source.getItemType())
            .name(name)
            .sku(blankToNull(request.sku()))
            .price(request.price().setScale(2, RoundingMode.HALF_UP))
            .taxRate(source.getTaxRate() == null ? BigDecimal.ZERO : source.getTaxRate())
            .available(source.isAvailable())
            .active(true)
            .stationId(source.getStationId())
            .menuCategoryId(source.getMenuCategoryId())
            .category(source.getCategory())
            .imageUrl(source.getImageUrl())
            .description(source.getDescription())
            .prepMinutes(source.getPrepMinutes())
            .portionAmount(portionAmount)
            .portionUnit(portionUnit)
            .portionGrams(MenuPortionFormat.gramsFromAmount(portionAmount, portionUnit))
            .portionLabel(blankToNull(request.portionLabel()))
            .variantGroupId(groupId)
            .tags(source.getTags())
            .sortOrder(source.getSortOrder())
            .build());

        List<UUID> groupIds = linkRepository.findByMenuItemId(source.getId()).stream()
            .map(MenuItemModifierLink::getGroupId)
            .toList();
        modifierBinder.replace(saved.getId(), companyId, source.getStoreId(), groupIds);

        LogUtil.info(
            MenuItemCreateVariantHandler.class,
            "Menu variant created: id={}, sourceId={}, groupId={}",
            saved.getId(),
            sourceItemId,
            groupId
        );
        return itemMapper.toResponse(saved);
    }

    private static BigDecimal normalizeAmount(BigDecimal value) {
        if (value == null || value.signum() <= 0) {
            return null;
        }
        return value.setScale(3, RoundingMode.HALF_UP);
    }

    private static String blankToNull(String value) {
        if (value == null || value.isBlank()) {
            return null;
        }
        return value.trim();
    }
}
