package com.pos.restaurant.order.dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;

public record OpenOrderRequest(
    @NotNull @Min(1) @Max(99) Integer guestCount,
    @Min(0) @Max(99) Integer adultCount,
    @Min(0) @Max(99) Integer childrenCount,
    String comment
) {}
