package com.pos.identity.dto.access;

import jakarta.validation.constraints.NotNull;

import java.util.Map;

public record UpdateRoleTemplateRequest(
    @NotNull Map<String, Boolean> modules,
    Boolean applyToExisting
) {
}
