package com.pos.restaurant.dto;

import com.pos.restaurant.domain.KitchenTicketStatus;
import jakarta.validation.constraints.NotNull;

public record UpdateKitchenTicketStatusRequest(
    @NotNull KitchenTicketStatus status
) {}
