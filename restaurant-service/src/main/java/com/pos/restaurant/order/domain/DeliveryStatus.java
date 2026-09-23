package com.pos.restaurant.order.domain;

/** Fulfillment lifecycle for DELIVERY channel (orthogonal to OrderStatus payment lifecycle). */
public enum DeliveryStatus {
    NEW,
    READY,
    ON_THE_WAY,
    DELIVERED
}
