package com.pos.restaurant.pickup.domain;

import com.pos.restaurant.order.domain.OrderChannel;

public final class PickupChannelPolicy {

    private PickupChannelPolicy() {}

    public static boolean supports(OrderChannel channel) {
        return channel == OrderChannel.TAKEAWAY
            || channel == OrderChannel.DELIVERY
            || channel == OrderChannel.DINE_IN;
    }
}
