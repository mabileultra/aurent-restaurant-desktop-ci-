package com.pos.restaurant.shift.support;

import com.pos.restaurant.shift.dto.ShiftResponse;
import com.pos.restaurant.shift.entity.RestaurantShift;
import org.springframework.stereotype.Component;

@Component
public class ShiftResponseAssembler {

    public ShiftResponse toResponse(RestaurantShift shift, int openOrderCount, ShiftCashMath.Drawer drawer) {
        ShiftCashMath.Drawer safe = drawer == null ? ShiftCashMath.Drawer.zero() : drawer;
        return new ShiftResponse(
            shift.getId(),
            shift.getStoreId(),
            shift.getStatus(),
            shift.getOpenedByUserId(),
            shift.getClosedByUserId(),
            shift.getOpenedAt(),
            shift.getClosedAt(),
            ShiftCashMath.money(shift.getOpeningCash()),
            shift.getClosingCash() == null ? null : ShiftCashMath.money(shift.getClosingCash()),
            shift.getSaleCount(),
            ShiftCashMath.money(shift.getTotalAmount()),
            ShiftCashMath.money(shift.getCashAmount()),
            ShiftCashMath.money(shift.getCardAmount()),
            shift.getComment(),
            openOrderCount,
            safe.cashIn(),
            safe.cashOut(),
            safe.collection(),
            ShiftCashMath.expected(shift.getOpeningCash(), shift.getCashAmount(), safe),
            shift.getHandoverExpected() == null ? null : ShiftCashMath.money(shift.getHandoverExpected()),
            shift.getHandoverDiff() == null ? null : ShiftCashMath.money(shift.getHandoverDiff())
        );
    }

    public ShiftResponse toResponse(RestaurantShift shift, int openOrderCount) {
        return toResponse(shift, openOrderCount, ShiftCashMath.Drawer.zero());
    }
}
