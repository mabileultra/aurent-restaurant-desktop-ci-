package com.pos.restaurant.modifier.repository;

import com.pos.restaurant.modifier.entity.MenuItemModifierLink;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.transaction.annotation.Transactional;

import java.util.Collection;
import java.util.List;
import java.util.UUID;

public interface MenuItemModifierLinkRepository extends JpaRepository<MenuItemModifierLink, MenuItemModifierLink.Key> {

    List<MenuItemModifierLink> findByMenuItemId(UUID menuItemId);

    List<MenuItemModifierLink> findByMenuItemIdIn(Collection<UUID> menuItemIds);

    @Modifying
    @Transactional
    void deleteByMenuItemId(UUID menuItemId);
}
