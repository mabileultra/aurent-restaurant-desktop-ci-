package com.pos.restaurant.order.dto;

import java.time.Instant;
import java.util.UUID;

public record WaiterHistoryEntryResponse(
    UUID waiterUserId,
    Instant assignedAt
) {}
