package com.pos.pharmacy.shift.dto;

import java.time.Instant;
import java.util.List;

/** Goods slip printed when a pharmacy shift closes. */
public record ShiftSoldItemsReport(
    Instant from,
    Instant to,
    List<ShiftItemRow> items
) {}
