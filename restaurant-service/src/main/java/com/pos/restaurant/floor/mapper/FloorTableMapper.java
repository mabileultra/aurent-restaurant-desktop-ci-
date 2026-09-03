package com.pos.restaurant.floor.mapper;

import com.pos.restaurant.config.RestaurantMapperConfig;
import com.pos.restaurant.floor.dto.TableResponse;
import com.pos.restaurant.floor.entity.FloorTable;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

@Mapper(config = RestaurantMapperConfig.class)
public interface FloorTableMapper {

    @Mapping(target = "hallId", source = "hall.id")
    @Mapping(target = "hallName", source = "hall.name")
    @Mapping(target = "activeOrder", ignore = true)
    TableResponse toResponse(FloorTable table);
}
