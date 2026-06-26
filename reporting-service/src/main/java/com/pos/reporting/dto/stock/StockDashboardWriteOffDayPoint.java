package com.pos.reporting.dto.stock;

public record StockDashboardWriteOffDayPoint(
    String date,
    long writeOffUnits
) {
}
