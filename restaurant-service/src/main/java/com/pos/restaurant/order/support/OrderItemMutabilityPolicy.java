package com.pos.restaurant.order.support;

import com.pos.restaurant.exception.BusinessException;
import com.pos.restaurant.order.domain.OrderItemStatus;
import com.pos.restaurant.order.entity.FloorOrderItem;
import org.springframework.stereotype.Component;

@Component
public class OrderItemMutabilityPolicy {

    public void assertMutable(FloorOrderItem item) {
        if (item.getItemStatus() != OrderItemStatus.NEW) {
            throw new BusinessException("Cannot change an item that was already sent to the kitchen");
        }
    }
}
