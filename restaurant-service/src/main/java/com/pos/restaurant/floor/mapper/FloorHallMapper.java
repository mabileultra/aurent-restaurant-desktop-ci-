package com.pos.restaurant.floor.mapper;

import com.pos.restaurant.config.RestaurantMapperConfig;
import com.pos.restaurant.floor.dto.HallResponse;
import com.pos.restaurant.floor.entity.FloorHall;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

@Mapper(config = RestaurantMapperConfig.class)
public interface FloorHallMapper {

    @Mapping(target = "tableCount", source = "tableCount")
    HallResponse toResponse(FloorHall hall, int tableCount);
}
