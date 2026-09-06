package com.pos.restaurant.order.dto;

import jakarta.validation.constraints.NotNull;

import java.util.UUID;

public record AssignWaiterRequest(
    @NotNull UUID waiterUserId
) {}
