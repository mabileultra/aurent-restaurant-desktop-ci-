package com.pos.restaurant.commission.dto;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

public record WaiterCommissionOrderRow(
    UUID orderId,
    int orderNo,
    String tableCode,
    Instant closedAt,
    BigDecimal subtotal,
    BigDecimal commissionPercent,
    BigDecimal commissionAmount
) {}
