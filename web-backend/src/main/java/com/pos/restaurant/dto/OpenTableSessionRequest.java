package com.pos.restaurant.dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;

import java.util.UUID;

public record OpenTableSessionRequest(
    @NotNull @Min(1) @Max(99) Integer guestCount,
    UUID waiterUserId,
    String notes
) {}
