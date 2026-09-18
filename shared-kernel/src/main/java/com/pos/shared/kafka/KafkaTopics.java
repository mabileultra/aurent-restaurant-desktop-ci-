package com.pos.shared.kafka;

public final class KafkaTopics {

    public static final String FINANCE_INTEGRATION = "pos.finance.integration";
    public static final String SALES_COMPLETED = "pos.sales.completed";
    public static final String STOCK_RECEIVED = "pos.stock.received";
    public static final String STOCK_MOVEMENT_RECORDED = "pos.stock.movement.recorded";
    public static final String STOCK_INVENTORY_RECORDED = "pos.stock.inventory.recorded";
    public static final String STOCK_TRANSFER_RECORDED = "pos.stock.transfer.recorded";
    public static final String PRODUCT_SNAPSHOT = "pos.catalog.product.snapshot";
    public static final String SHIFT_CLOSED = "pos.shifts.closed";
    public static final String REPORTING_DLQ = "pos.reporting.dlq";
    public static final String FINANCE_DLQ = "pos.finance.dlq";

    private KafkaTopics() {
    }
}
