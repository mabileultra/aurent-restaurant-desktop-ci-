package com.pos.identity.dto.auth;

import java.util.UUID;

public record PinRosterEntryResponse(
    UUID id,
    String displayName,
    String role
) {}
