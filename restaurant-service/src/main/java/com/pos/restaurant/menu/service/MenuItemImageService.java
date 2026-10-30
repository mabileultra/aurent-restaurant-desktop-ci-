package com.pos.restaurant.menu.service;

import com.pos.restaurant.menu.support.MenuItemDataUriParser;

import java.util.UUID;

public interface MenuItemImageService {

    MenuItemDataUriParser.Parsed getImage(UUID itemId);
}
