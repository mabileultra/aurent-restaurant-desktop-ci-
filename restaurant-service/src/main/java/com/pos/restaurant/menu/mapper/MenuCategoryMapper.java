package com.pos.restaurant.menu.mapper;

import com.pos.restaurant.config.RestaurantMapperConfig;
import com.pos.restaurant.menu.dto.MenuCategoryResponse;
import com.pos.restaurant.menu.entity.MenuCategory;
import org.mapstruct.Mapper;

@Mapper(config = RestaurantMapperConfig.class)
public interface MenuCategoryMapper {

    MenuCategoryResponse toResponse(MenuCategory category);
}
