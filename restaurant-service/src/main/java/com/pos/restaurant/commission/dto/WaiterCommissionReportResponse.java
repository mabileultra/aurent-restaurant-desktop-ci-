package com.pos.restaurant.commission.dto;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;

public record WaiterCommissionReportResponse(
    Instant from,
    Instant to,
    long orderCount,
    BigDecimal salesTotal,
    BigDecimal commissionTotal,
    List<WaiterCommissionReportRow> rows
) {}
