package com.pos.restaurant.pickup.support;

import com.pos.restaurant.order.entity.FloorOrder;
import com.pos.restaurant.order.repository.FloorOrderRepository;
import com.pos.restaurant.shift.entity.RestaurantShift;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class PickupNumberIssuer {

    private final FloorOrderRepository orderRepository;

    public int assignOnce(FloorOrder order) {
        if (order.getPickupNo() != null && order.getPickupNo() > 0) {
            return order.getPickupNo();
        }
        RestaurantShift shift = order.getShift();
        int next = orderRepository.findMaxPickupNoByShiftId(shift.getId()) + 1;
        order.setPickupNo(next);
        return next;
    }
}
