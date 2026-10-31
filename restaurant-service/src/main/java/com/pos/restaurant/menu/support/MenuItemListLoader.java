package com.pos.restaurant.menu.support;

import com.pos.restaurant.config.RestaurantCacheNames;
import com.pos.restaurant.menu.dto.MenuItemResponse;
import com.pos.restaurant.menu.entity.MenuItem;
import com.pos.restaurant.menu.mapper.MenuItemMapper;
import com.pos.restaurant.menu.repository.MenuItemRepository;
import com.pos.restaurant.modifier.entity.MenuItemModifierLink;
import com.pos.restaurant.modifier.repository.MenuItemModifierLinkRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

/** Cached menu catalog load — auth must run in the caller before this. */
@Component
@RequiredArgsConstructor
public class MenuItemListLoader {

    private final MenuItemRepository itemRepository;
    private final MenuItemMapper itemMapper;
    private final MenuItemModifierLinkRepository linkRepository;
    private final MenuItemResponseFactory responseFactory;

    @Cacheable(
        cacheNames = RestaurantCacheNames.MENU,
        key = "T(com.pos.restaurant.security.RestaurantTenantContext).getCompanyId() + ':' + #storeId + ':' + #posOnly",
        sync = true
    )
    public List<MenuItemResponse> load(Integer companyId, Integer storeId, boolean posOnly) {
        List<MenuItem> items = posOnly
            ? itemRepository.findByCompanyIdAndStoreIdAndActiveTrueAndAvailableTrueOrderBySortOrderAscNameAsc(
                companyId, storeId
            )
            : itemRepository.findByCompanyIdAndStoreIdOrderBySortOrderAscNameAsc(companyId, storeId);
        return withGroups(items);
    }

    private List<MenuItemResponse> withGroups(List<MenuItem> items) {
        if (items.isEmpty()) {
            return List.of();
        }
        List<UUID> ids = items.stream().map(MenuItem::getId).toList();
        Map<UUID, List<UUID>> groups = linkRepository.findByMenuItemIdIn(ids).stream()
            .collect(Collectors.groupingBy(
                MenuItemModifierLink::getMenuItemId,
                Collectors.mapping(MenuItemModifierLink::getGroupId, Collectors.toList())
            ));
        return items.stream()
            .map(item -> responseFactory.withGroups(
                itemMapper.toResponse(item),
                groups.getOrDefault(item.getId(), List.of())
            ))
            .toList();
    }
}
