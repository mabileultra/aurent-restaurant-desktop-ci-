package com.pos.restaurant.kitchen.mapper;

import com.pos.restaurant.config.RestaurantMapperConfig;
import com.pos.restaurant.kitchen.dto.StationResponse;
import com.pos.restaurant.kitchen.entity.KitchenStation;
import org.mapstruct.Mapper;

@Mapper(config = RestaurantMapperConfig.class)
public interface KitchenStationMapper {

    StationResponse toResponse(KitchenStation station);
}
