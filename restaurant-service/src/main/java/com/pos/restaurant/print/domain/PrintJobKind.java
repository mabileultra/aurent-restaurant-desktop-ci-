package com.pos.restaurant.print.domain;

public enum PrintJobKind {
    GUEST_BILL,
    /** Full order cancel from cashier — receipt (cashier) printer only. */
    ORDER_CANCEL,
    KITCHEN_SEND,
    CATEGORY_SLIP,
    CATEGORY_BATCH
}
