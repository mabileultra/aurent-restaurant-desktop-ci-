package com.pos.restaurant.pickup.support;

import com.pos.restaurant.order.entity.FloorOrder;
import com.pos.restaurant.pickup.domain.PickupChannelPolicy;
import com.pos.restaurant.security.RestaurantTenantContext;
import org.springframework.stereotype.Component;

@Component
public class PickupLabelPolicy {

    public boolean canUseFeature() {
        return RestaurantTenantContext.canPrintPickupLabel();
    }

    public boolean canAssign(FloorOrder order) {
        if (!canUseFeature() || order == null) {
            return false;
        }
        if (!PickupChannelPolicy.supports(order.getChannel())) {
            return false;
        }
        return order.getShift() != null && order.getShift().getId() != null;
    }

    public boolean alreadyNumbered(FloorOrder order) {
        return order != null && order.getPickupNo() != null && order.getPickupNo() > 0;
    }
}
