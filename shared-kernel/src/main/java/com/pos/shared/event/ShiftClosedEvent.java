package com.pos.shared.event;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;

/**
 * Событие закрытия смены / Z-отчёта (для message bus, фаза 5).
 */
public record ShiftClosedEvent(
    Integer companyId,
    Integer storeId,
    UUID shiftId,
    Long zReportId,
    BigDecimal totalSales,
    LocalDate businessDate,
    Integer zNumber,
    String storeName,
    Instant closedAt,
    Integer salesCount,
    String employeeName
) {
}
