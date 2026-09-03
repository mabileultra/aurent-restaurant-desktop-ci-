package com.pos.restaurant.menu.service;

import com.pos.restaurant.menu.dto.MenuItemResponse;
import com.pos.restaurant.menu.dto.SaveMenuItemRequest;

import java.util.List;
import java.util.UUID;

public interface MenuItemService {

    List<MenuItemResponse> list(Integer storeId, boolean posOnly);

    MenuItemResponse create(Integer storeId, SaveMenuItemRequest request);

    MenuItemResponse update(UUID itemId, SaveMenuItemRequest request);

    void deactivate(UUID itemId);
}
