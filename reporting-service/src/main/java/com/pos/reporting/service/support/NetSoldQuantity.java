package com.pos.reporting.service.support;

public final class NetSoldQuantity {

    private NetSoldQuantity() {
    }

    public static long of(long quantity, long quantityReturned) {
        long net = quantity - Math.max(0L, quantityReturned);
        return Math.max(0L, net);
    }
}
