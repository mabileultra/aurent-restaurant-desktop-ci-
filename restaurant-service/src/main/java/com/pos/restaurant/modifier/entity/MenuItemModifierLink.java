package com.pos.restaurant.modifier.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.IdClass;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.io.Serializable;
import java.util.UUID;

@Entity
@Table(name = "menu_item_modifier_groups")
@IdClass(MenuItemModifierLink.Key.class)
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class MenuItemModifierLink {

    @Id
    @Column(name = "menu_item_id", nullable = false)
    private UUID menuItemId;

    @Id
    @Column(name = "group_id", nullable = false)
    private UUID groupId;

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    public static class Key implements Serializable {
        private UUID menuItemId;
        private UUID groupId;
    }
}
