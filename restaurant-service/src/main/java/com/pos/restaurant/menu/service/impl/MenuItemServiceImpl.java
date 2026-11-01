package com.pos.restaurant.menu.service.impl;

import com.pos.restaurant.config.RestaurantHotCache;
import com.pos.restaurant.floor.support.FloorTenantSupport;
import com.pos.restaurant.floor.support.StoreTenantSupport;
import com.pos.restaurant.menu.dto.CreateMenuVariantRequest;
import com.pos.restaurant.menu.dto.MenuItemResponse;
import com.pos.restaurant.menu.dto.SaveMenuItemRequest;
import com.pos.restaurant.menu.repository.MenuItemRepository;
import com.pos.restaurant.menu.service.MenuItemService;
import com.pos.restaurant.menu.support.MenuItemListLoader;
import com.pos.restaurant.menu.support.MenuItemResponseFactory;
import com.pos.restaurant.modifier.repository.MenuItemModifierLinkRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class MenuItemServiceImpl implements MenuItemService {

    private final MenuItemRepository itemRepository;
    private final FloorTenantSupport tenantSupport;
    private final StoreTenantSupport storeTenantSupport;
    private final MenuItemListLoader listLoader;
    private final MenuItemCreateHandler createHandler;
    private final MenuItemUpdateHandler updateHandler;
    private final MenuItemCreateVariantHandler createVariantHandler;
    private final MenuItemDeactivateHandler deactivateHandler;
    private final MenuItemModifierLinkRepository linkRepository;
    private final MenuItemResponseFactory responseFactory;
    private final RestaurantHotCache hotCache;

    @Override
    public List<MenuItemResponse> list(Integer storeId, boolean posOnly) {
        storeTenantSupport.requireStore(storeId);
        Integer companyId = tenantSupport.requireCompanyId();
        return listLoader.load(companyId, storeId, posOnly);
    }

    @Override
    @Transactional
    public MenuItemResponse create(Integer storeId, SaveMenuItemRequest request) {
        MenuItemResponse created = createHandler.handle(storeId, request);
        hotCache.evictMenu(tenantSupport.requireCompanyId(), storeId);
        return created;
    }

    @Override
    @Transactional
    public MenuItemResponse update(UUID itemId, SaveMenuItemRequest request) {
        MenuItemResponse updated = updateHandler.handle(itemId, request);
        hotCache.evictMenu(tenantSupport.requireCompanyId(), updated.storeId());
        return updated;
    }

    @Override
    @Transactional
    public MenuItemResponse createVariant(UUID itemId, CreateMenuVariantRequest request) {
        MenuItemResponse created = createVariantHandler.handle(itemId, request);
        List<UUID> groups = linkRepository.findByMenuItemId(created.id()).stream()
            .map(link -> link.getGroupId())
            .toList();
        hotCache.evictMenu(tenantSupport.requireCompanyId(), created.storeId());
        return responseFactory.withGroups(created, groups);
    }

    @Override
    @Transactional
    public void deactivate(UUID itemId) {
        Integer storeId = itemRepository.findById(itemId).map(item -> item.getStoreId()).orElse(null);
        deactivateHandler.handle(itemId);
        hotCache.evictMenu(tenantSupport.requireCompanyId(), storeId);
    }
}
