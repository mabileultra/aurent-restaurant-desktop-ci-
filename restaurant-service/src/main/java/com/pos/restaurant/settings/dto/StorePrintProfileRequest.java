package com.pos.restaurant.settings.dto;

import jakarta.validation.constraints.NotNull;

import java.util.Map;

public record StorePrintProfileRequest(
    @NotNull Map<String, Object> profile
) {}
