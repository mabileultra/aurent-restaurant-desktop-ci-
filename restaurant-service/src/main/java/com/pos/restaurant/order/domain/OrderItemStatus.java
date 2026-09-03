package com.pos.restaurant.order.domain;

public enum OrderItemStatus {
    NEW,
    SENT_TO_KITCHEN,
    ACCEPTED,
    PREPARING,
    READY,
    SERVED,
    CANCELLED
}
