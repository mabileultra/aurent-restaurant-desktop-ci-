package com.pos.restaurant.settings.dto;

public record ForeignTableOrderSettingsResponse(
    Integer storeId,
    boolean allowed
) {}
