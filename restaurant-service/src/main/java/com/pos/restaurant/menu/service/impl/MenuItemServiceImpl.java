package com.pos.restaurant.menu.service.impl;

import com.pos.restaurant.config.RestaurantCacheNames;
import com.pos.restaurant.config.RestaurantHotCache;
import com.pos.restaurant.floor.support.FloorTenantSupport;
import com.pos.restaurant.menu.dto.CreateMenuVariantRequest;
import com.pos.restaurant.menu.dto.MenuItemResponse;
import com.pos.restaurant.menu.dto.SaveMenuItemRequest;
import com.pos.restaurant.menu.entity.MenuItem;
import com.pos.restaurant.menu.mapper.MenuItemMapper;
import com.pos.restaurant.menu.repository.MenuItemRepository;
import com.pos.restaurant.menu.service.MenuItemService;
import com.pos.restaurant.menu.support.MenuItemResponseFactory;
import com.pos.restaurant.modifier.entity.MenuItemModifierLink;
import com.pos.restaurant.modifier.repository.MenuItemModifierLinkRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class MenuItemServiceImpl implements MenuItemService {

    private final MenuItemRepository itemRepository;
    private final MenuItemMapper itemMapper;
    private final FloorTenantSupport tenantSupport;
    private final MenuItemCreateHandler createHandler;
    private final MenuItemUpdateHandler updateHandler;
    private final MenuItemCreateVariantHandler createVariantHandler;
    private final MenuItemDeactivateHandler deactivateHandler;
    private final MenuItemModifierLinkRepository linkRepository;
    private final MenuItemResponseFactory responseFactory;
    private final RestaurantHotCache hotCache;

    @Override
    @Cacheable(cacheNames = RestaurantCacheNames.MENU, key = "#storeId + ':' + #posOnly")
    public List<MenuItemResponse> list(Integer storeId, boolean posOnly) {
        Integer companyId = tenantSupport.requireCompanyId();
        List<MenuItem> items = posOnly
            ? itemRepository.findByCompanyIdAndStoreIdAndActiveTrueAndAvailableTrueOrderBySortOrderAscNameAsc(companyId, storeId)
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

    @Override
    @Transactional
    public MenuItemResponse create(Integer storeId, SaveMenuItemRequest request) {
        MenuItemResponse created = createHandler.handle(storeId, request);
        hotCache.evictMenu(storeId);
        return created;
    }

    @Override
    @Transactional
    public MenuItemResponse update(UUID itemId, SaveMenuItemRequest request) {
        MenuItemResponse updated = updateHandler.handle(itemId, request);
        hotCache.evictMenu(updated.storeId());
        return updated;
    }

    @Override
    @Transactional
    public MenuItemResponse createVariant(UUID itemId, CreateMenuVariantRequest request) {
        MenuItemResponse created = createVariantHandler.handle(itemId, request);
        List<UUID> groups = linkRepository.findByMenuItemId(created.id()).stream()
            .map(MenuItemModifierLink::getGroupId)
            .toList();
        hotCache.evictMenu(created.storeId());
        return responseFactory.withGroups(created, groups);
    }

    @Override
    @Transactional
    public void deactivate(UUID itemId) {
        Integer storeId = itemRepository.findById(itemId).map(MenuItem::getStoreId).orElse(null);
        deactivateHandler.handle(itemId);
        hotCache.evictMenu(storeId);
    }
}
