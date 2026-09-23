package com.pos.restaurant.order.dto;

import jakarta.validation.constraints.Size;

import java.util.UUID;

public record UpdateDeliveryDetailsRequest(
    @Size(max = 160) String clientName,
    @Size(max = 40) String clientPhone,
    @Size(max = 400) String deliveryAddress,
    @Size(max = 500) String comment,
    UUID courierUserId
) {}
