package com.pos.reporting.dto.stock;

public record StockDashboardDayPoint(
    String date,
    long receivedUnits,
    long soldUnits,
    long writeOffUnits
) {
}
