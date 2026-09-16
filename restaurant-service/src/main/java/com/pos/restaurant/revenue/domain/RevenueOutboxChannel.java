package com.pos.restaurant.revenue.domain;

public enum RevenueOutboxChannel {
    SALE_COMPLETED,
    FINANCE_INCOME,
    REFUND_EXPENSE,
    STOCK_CONSUME,
    STOCK_RESTORE
}
