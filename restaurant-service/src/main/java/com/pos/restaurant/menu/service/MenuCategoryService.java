package com.pos.restaurant.menu.service;

import com.pos.restaurant.menu.dto.MenuCategoryResponse;
import com.pos.restaurant.menu.dto.SaveMenuCategoryRequest;

import java.util.List;
import java.util.UUID;

public interface MenuCategoryService {

    List<MenuCategoryResponse> list(Integer storeId, boolean activeOnly);

    MenuCategoryResponse create(Integer storeId, SaveMenuCategoryRequest request);

    MenuCategoryResponse update(UUID categoryId, SaveMenuCategoryRequest request);

    void deactivate(UUID categoryId);
}
