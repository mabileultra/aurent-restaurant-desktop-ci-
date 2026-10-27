package com.pos.restaurant.menu.service.impl;

import com.pos.restaurant.exception.NotFoundException;
import com.pos.restaurant.floor.support.FloorTenantSupport;
import com.pos.restaurant.menu.entity.MenuItem;
import com.pos.restaurant.menu.repository.MenuItemRepository;
import com.pos.restaurant.menu.service.MenuItemImageService;
import com.pos.restaurant.menu.support.MenuItemDataUriParser;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class MenuItemImageServiceImpl implements MenuItemImageService {

    private final MenuItemRepository itemRepository;
    private final FloorTenantSupport tenantSupport;

    @Override
    public MenuItemDataUriParser.Parsed getImage(UUID itemId) {
        Integer companyId = tenantSupport.requireCompanyId();
        MenuItem item = itemRepository.findByIdAndCompanyId(itemId, companyId)
            .orElseThrow(() -> new NotFoundException("Menu item not found"));
        return MenuItemDataUriParser.requireParsed(item.getImageUrl());
    }
}
