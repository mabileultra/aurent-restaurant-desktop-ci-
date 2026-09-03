package com.pos.restaurant.mapper;

import com.pos.restaurant.dto.DiningHallResponse;
import com.pos.restaurant.dto.DiningTableResponse;
import com.pos.restaurant.entity.DiningHall;
import com.pos.restaurant.entity.DiningTable;
import org.springframework.stereotype.Component;

import java.util.List;

@Component
public class RestaurantFloorMapper {

    public DiningHallResponse toHallResponse(DiningHall hall, int tablesCount) {
        return new DiningHallResponse(
            hall.getId(),
            hall.getStore().getId(),
            hall.getStore().getName(),
            hall.getName(),
            hall.getSortOrder(),
            hall.isActive(),
            tablesCount
        );
    }

    public DiningTableResponse toTableResponse(DiningTable table) {
        return new DiningTableResponse(
            table.getId(),
            table.getHall().getId(),
            table.getHall().getName(),
            table.getCode(),
            table.getLabel(),
            table.getSeatCount(),
            table.getPosX(),
            table.getPosY(),
            table.getWidth(),
            table.getHeight(),
            table.getStatus(),
            table.isActive()
        );
    }

    public List<DiningTableResponse> toTableResponses(List<DiningTable> tables) {
        return tables.stream().map(this::toTableResponse).toList();
    }
}
