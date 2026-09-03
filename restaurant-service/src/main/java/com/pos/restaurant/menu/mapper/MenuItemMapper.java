package com.pos.restaurant.menu.mapper;

import com.pos.restaurant.config.RestaurantMapperConfig;
import com.pos.restaurant.menu.dto.MenuItemResponse;
import com.pos.restaurant.menu.entity.MenuItem;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

@Mapper(config = RestaurantMapperConfig.class)
public interface MenuItemMapper {

    @Mapping(target = "modifierGroupIds", ignore = true)
    MenuItemResponse toResponse(MenuItem item);
}
