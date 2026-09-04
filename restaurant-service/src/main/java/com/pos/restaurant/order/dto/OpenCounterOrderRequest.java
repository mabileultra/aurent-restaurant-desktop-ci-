package com.pos.restaurant.order.dto;

import jakarta.validation.constraints.Size;

public record OpenCounterOrderRequest(
    @Size(max = 160) String clientName,
    @Size(max = 40) String clientPhone,
    @Size(max = 400) String deliveryAddress,
    @Size(max = 500) String comment
) {}
