package com.pos.restaurant.order.dto;

import com.pos.restaurant.order.domain.DeliveryStatus;
import jakarta.validation.constraints.NotNull;

public record UpdateDeliveryStatusRequest(
    @NotNull DeliveryStatus deliveryStatus
) {}
