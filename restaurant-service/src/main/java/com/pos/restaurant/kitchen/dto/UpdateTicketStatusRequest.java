package com.pos.restaurant.kitchen.dto;

import com.pos.restaurant.kitchen.domain.KitchenTicketStatus;
import jakarta.validation.constraints.NotNull;

public record UpdateTicketStatusRequest(
    @NotNull KitchenTicketStatus status
) {}
