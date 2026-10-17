package com.pos.restaurant.edge.dto;

import java.util.UUID;

public record EdgePinRosterEntry(
    UUID id,
    String displayName,
    String role
) {}
