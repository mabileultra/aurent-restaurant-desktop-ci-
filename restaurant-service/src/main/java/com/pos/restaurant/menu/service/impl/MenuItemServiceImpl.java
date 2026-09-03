package com.pos.restaurant.menu.service.impl;

import com.pos.restaurant.floor.support.FloorTenantSupport;
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
    private final MenuItemDeactivateHandler deactivateHandler;
    private final MenuItemModifierLinkRepository linkRepository;
    private final MenuItemResponseFactory responseFactory;

    @Override
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
        return createHandler.handle(storeId, request);
    }

    @Override
    @Transactional
    public MenuItemResponse update(UUID itemId, SaveMenuItemRequest request) {
        return updateHandler.handle(itemId, request);
    }

    @Override
    @Transactional
    public void deactivate(UUID itemId) {
        deactivateHandler.handle(itemId);
    }
}
