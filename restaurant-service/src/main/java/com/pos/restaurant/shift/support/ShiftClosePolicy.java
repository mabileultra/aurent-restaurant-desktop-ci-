package com.pos.restaurant.shift.support;

import com.pos.restaurant.exception.BusinessException;
import com.pos.restaurant.order.domain.OrderStatus;
import com.pos.restaurant.order.repository.FloorOrderRepository;
import com.pos.restaurant.shift.domain.RestaurantShiftStatus;
import com.pos.restaurant.shift.entity.RestaurantShift;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.UUID;

@Component
@RequiredArgsConstructor
public class ShiftClosePolicy {

    private final FloorOrderRepository orderRepository;

    public void assertCanClose(RestaurantShift shift) {
        if (shift.getStatus() != RestaurantShiftStatus.OPEN) {
            throw new BusinessException("Shift is already closed");
        }
        long openOrders = orderRepository.countByShiftIdAndStatusIn(
            shift.getId(),
            List.of(OrderStatus.OPEN, OrderStatus.BILLING)
        );
        if (openOrders > 0) {
            throw new BusinessException("Cannot close shift with open orders");
        }
    }

    public int openOrderCount(UUID shiftId) {
        if (shiftId == null) {
            return 0;
        }
        return (int) orderRepository.countByShiftIdAndStatusIn(
            shiftId,
            List.of(OrderStatus.OPEN, OrderStatus.BILLING)
        );
    }
}
