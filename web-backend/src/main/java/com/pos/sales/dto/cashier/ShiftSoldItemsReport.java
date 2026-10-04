package com.pos.sales.dto.cashier;

import java.time.Instant;
import java.util.List;

/** Goods slip for the shift period that the closing Z-report covers. */
public record ShiftSoldItemsReport(
    Instant from,
    Instant to,
    List<ShiftItemRow> items
) {}
