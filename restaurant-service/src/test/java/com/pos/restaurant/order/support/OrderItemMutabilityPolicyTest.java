package com.pos.restaurant.order.support;

import com.pos.restaurant.exception.BusinessException;
import com.pos.restaurant.order.domain.OrderItemStatus;
import com.pos.restaurant.order.entity.FloorOrderItem;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertDoesNotThrow;
import static org.junit.jupiter.api.Assertions.assertThrows;

class OrderItemMutabilityPolicyTest {

    private final OrderItemMutabilityPolicy policy = new OrderItemMutabilityPolicy();

    @Test
    void newItemsAreMutable() {
        FloorOrderItem item = FloorOrderItem.builder().itemStatus(OrderItemStatus.NEW).build();
        assertDoesNotThrow(() -> policy.assertMutable(item));
    }

    @Test
    void sentItemsAreLocked() {
        FloorOrderItem item = FloorOrderItem.builder().itemStatus(OrderItemStatus.SENT_TO_KITCHEN).build();
        assertThrows(BusinessException.class, () -> policy.assertMutable(item));
    }
}
