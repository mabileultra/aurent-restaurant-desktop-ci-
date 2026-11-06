package com.pos.identity.dto.access;

import jakarta.validation.constraints.NotEmpty;

import java.util.List;
import java.util.UUID;

public record BulkResetModuleAccessRequest(
    @NotEmpty List<UUID> userIds
) {}
