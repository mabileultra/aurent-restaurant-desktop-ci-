package com.pos.restaurant.pickup.service;

import com.pos.restaurant.order.dto.OrderResponse;
import com.pos.restaurant.order.entity.FloorOrder;
import com.pos.restaurant.order.entity.FloorOrderItem;

import java.util.List;
import java.util.UUID;

public interface PickupLabelService {

    /** First kitchen send: number once and enqueue. No-op without the Super Admin module. */
    void assignAndEnqueue(FloorOrder order, List<FloorOrderItem> items);

    /** Reprint the same number. Assigns if the order never got one. */
    OrderResponse reprint(UUID orderId);
}
