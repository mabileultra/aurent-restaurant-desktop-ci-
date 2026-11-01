package com.pos.restaurant.commission.dto;

import java.math.BigDecimal;
import java.util.UUID;

public record WaiterCommissionReportRow(
    UUID waiterUserId,
    String waiterName,
    long orderCount,
    BigDecimal salesTotal,
    BigDecimal commissionTotal
) {
}
