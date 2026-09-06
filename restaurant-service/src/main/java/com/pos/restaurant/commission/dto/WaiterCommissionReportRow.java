package com.pos.restaurant.commission.dto;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

public record WaiterCommissionReportRow(
    UUID waiterUserId,
    long orderCount,
    BigDecimal salesTotal,
    BigDecimal commissionTotal,
    List<WaiterCommissionOrderRow> orders
) {}
