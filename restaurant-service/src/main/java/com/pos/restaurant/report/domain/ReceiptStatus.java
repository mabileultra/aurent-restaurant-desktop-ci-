package com.pos.restaurant.report.domain;

/** Journal view of a paid check, derived from order status and returned quantities. */
public enum ReceiptStatus {
    PAID,
    PARTIAL_REFUND,
    REFUNDED
}
