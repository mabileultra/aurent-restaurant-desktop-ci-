package com.pos.restaurant.commission.dto;

import java.math.BigDecimal;
import java.util.List;

public record WaiterCommissionSettingsResponse(
    BigDecimal defaultPercent,
    List<WaiterCommissionOverrideResponse> overrides
) {}
