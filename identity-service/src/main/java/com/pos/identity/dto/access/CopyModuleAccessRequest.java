package com.pos.identity.dto.access;

import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;

import java.util.List;
import java.util.UUID;

public record CopyModuleAccessRequest(
    @NotNull UUID sourceUserId,
    @NotEmpty List<UUID> targetUserIds,
    /** MERGE | REPLACE — null → REPLACE */
    String strategy
) {}
