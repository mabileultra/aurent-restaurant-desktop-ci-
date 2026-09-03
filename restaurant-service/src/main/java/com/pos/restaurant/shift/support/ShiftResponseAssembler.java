package com.pos.restaurant.shift.support;

import com.pos.restaurant.shift.dto.ShiftResponse;
import com.pos.restaurant.shift.entity.RestaurantShift;
import org.springframework.stereotype.Component;

@Component
public class ShiftResponseAssembler {

    public ShiftResponse toResponse(RestaurantShift shift, int openOrderCount) {
        return new ShiftResponse(
            shift.getId(),
            shift.getStoreId(),
            shift.getStatus(),
            shift.getOpenedByUserId(),
            shift.getClosedByUserId(),
            shift.getOpenedAt(),
            shift.getClosedAt(),
            shift.getOpeningCash(),
            shift.getClosingCash(),
            shift.getSaleCount(),
            shift.getTotalAmount(),
            shift.getCashAmount(),
            shift.getCardAmount(),
            shift.getComment(),
            openOrderCount
        );
    }
}
