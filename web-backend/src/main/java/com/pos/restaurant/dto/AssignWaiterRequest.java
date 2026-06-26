package com.pos.restaurant.dto;

import jakarta.validation.constraints.NotNull;

import java.util.UUID;

public record AssignWaiterRequest(
    @NotNull UUID waiterUserId
) {}
