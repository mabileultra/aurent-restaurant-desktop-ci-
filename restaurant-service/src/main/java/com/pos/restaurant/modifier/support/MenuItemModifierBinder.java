package com.pos.restaurant.modifier.support;

import com.pos.restaurant.exception.BusinessException;
import com.pos.restaurant.modifier.entity.MenuItemModifierLink;
import com.pos.restaurant.modifier.entity.ModifierGroup;
import com.pos.restaurant.modifier.repository.MenuItemModifierLinkRepository;
import com.pos.restaurant.modifier.repository.ModifierGroupRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.UUID;

@Component
@RequiredArgsConstructor
public class MenuItemModifierBinder {

    private final MenuItemModifierLinkRepository linkRepository;
    private final ModifierGroupRepository groupRepository;

    public void replace(UUID menuItemId, Integer companyId, Integer storeId, List<UUID> groupIds) {
        linkRepository.deleteByMenuItemId(menuItemId);
        if (groupIds == null || groupIds.isEmpty()) {
            return;
        }
        List<UUID> distinct = groupIds.stream().distinct().toList();
        List<ModifierGroup> groups = groupRepository.findByIdInAndCompanyIdAndStoreIdAndActiveTrue(
            distinct, companyId, storeId
        );
        if (groups.size() != distinct.size()) {
            throw new BusinessException("One or more modifier groups are not available in this restaurant");
        }
        linkRepository.saveAll(groups.stream()
            .map(group -> new MenuItemModifierLink(menuItemId, group.getId()))
            .toList());
    }
}
