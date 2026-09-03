package com.pos.restaurant.menu.service.impl;

import com.pos.restaurant.exception.NotFoundException;
import com.pos.restaurant.floor.support.FloorTenantSupport;
import com.pos.restaurant.menu.entity.MenuItem;
import com.pos.restaurant.menu.repository.MenuItemRepository;
import com.pos.shared.log.LogUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

@Component
@RequiredArgsConstructor
public class MenuItemDeactivateHandler {

    private final MenuItemRepository itemRepository;
    private final FloorTenantSupport tenantSupport;

    @Transactional
    public void handle(UUID itemId) {
        Integer companyId = tenantSupport.requireCompanyId();
        MenuItem item = itemRepository.findByIdAndCompanyId(itemId, companyId)
            .orElseThrow(() -> new NotFoundException("Menu item not found: " + itemId));
        item.setActive(false);
        item.setAvailable(false);
        LogUtil.info(MenuItemDeactivateHandler.class, "Menu item deactivated: id={}", itemId);
    }
}
