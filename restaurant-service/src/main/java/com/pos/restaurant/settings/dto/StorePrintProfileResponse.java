package com.pos.restaurant.settings.dto;

import java.util.Map;

public record StorePrintProfileResponse(
    Integer storeId,
    Map<String, Object> profile
) {}
