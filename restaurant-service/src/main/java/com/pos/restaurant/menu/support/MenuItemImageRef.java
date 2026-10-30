package com.pos.restaurant.menu.support;

import java.util.UUID;

/** List payload marker — POS loads bytes via GET /rst/menu-items/{id}/image. */
public final class MenuItemImageRef {

    public static final String PREFIX = "aurent-menu-img:";

    private MenuItemImageRef() {
    }

    public static String forItem(UUID itemId) {
        return PREFIX + itemId;
    }

    public static boolean isRef(String value) {
        return value != null && value.startsWith(PREFIX);
    }
}
