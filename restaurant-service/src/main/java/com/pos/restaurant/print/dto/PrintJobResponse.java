package com.pos.restaurant.print.dto;

import com.pos.restaurant.print.domain.PrintJobKind;

import java.time.Instant;
import java.util.UUID;

public record PrintJobResponse(
    UUID id,
    PrintJobKind kind,
    String payload,
    Instant createdAt
) {}
