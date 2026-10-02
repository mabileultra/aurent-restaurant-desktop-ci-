package com.pos.restaurant.report.dto;

import java.math.BigDecimal;

/** One slice of sales: payment method, card rail, channel, hall, hour ("09") or day ("2026-10-01"). */
public record SalesBreakdownRow(String key, long count, BigDecimal amount) {
}
