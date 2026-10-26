package com.pos.restaurant.pickup.support;

import com.pos.restaurant.order.domain.OrderChannel;
import com.pos.restaurant.order.entity.FloorOrder;
import com.pos.restaurant.security.RestaurantTenantContext;
import com.pos.restaurant.shift.entity.RestaurantShift;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Test;

import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

class PickupLabelPolicyTest {

    private final PickupLabelPolicy policy = new PickupLabelPolicy();

    @AfterEach
    void clear() {
        RestaurantTenantContext.clear();
    }

    @Test
    void offWithoutModule() {
        FloorOrder order = takeaway();
        assertFalse(policy.canUseFeature());
        assertFalse(policy.canAssign(order));
    }

    @Test
    void onForTakeawayWithModule() {
        RestaurantTenantContext.set(1, UUID.randomUUID(), "CASHIER", false, true);
        assertTrue(policy.canUseFeature());
        assertTrue(policy.canAssign(takeaway()));
        assertTrue(policy.canAssign(dineIn()));
    }

    @Test
    void alreadyNumbered() {
        FloorOrder order = takeaway();
        order.setPickupNo(4);
        assertTrue(policy.alreadyNumbered(order));
    }

    private static FloorOrder takeaway() {
        return FloorOrder.builder()
            .channel(OrderChannel.TAKEAWAY)
            .shift(RestaurantShift.builder().id(UUID.randomUUID()).build())
            .build();
    }

    private static FloorOrder dineIn() {
        return FloorOrder.builder()
            .channel(OrderChannel.DINE_IN)
            .shift(RestaurantShift.builder().id(UUID.randomUUID()).build())
            .build();
    }
}
