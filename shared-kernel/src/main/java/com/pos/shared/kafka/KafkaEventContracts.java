package com.pos.shared.kafka;

/**
 * Карта топик → контракт (без Schema Registry в v1).
 */
public final class KafkaEventContracts {

    public static final int CURRENT_SCHEMA_VERSION = 1;

    private KafkaEventContracts() {
    }

    public static String contractFor(String topic) {
        if (topic == null) {
            return "unknown";
        }
        return switch (topic) {
            case KafkaTopics.FINANCE_INTEGRATION -> FinanceIntegrationMessage.class.getName();
            case KafkaTopics.SALES_COMPLETED -> "com.pos.shared.event.SaleCompletedEvent";
            case KafkaTopics.STOCK_RECEIVED -> "com.pos.shared.event.StockReceivedEvent";
            case KafkaTopics.STOCK_MOVEMENT_RECORDED -> "com.pos.shared.event.StockMovementRecordedEvent";
            case KafkaTopics.STOCK_INVENTORY_RECORDED -> "com.pos.shared.event.StockInventoryRecordedEvent";
            case KafkaTopics.STOCK_TRANSFER_RECORDED -> "com.pos.shared.event.StockTransferRecordedEvent";
            case KafkaTopics.PRODUCT_SNAPSHOT -> "com.pos.shared.event.ProductSnapshotEvent";
            case KafkaTopics.SHIFT_CLOSED -> "com.pos.shared.event.ShiftClosedEvent";
            case KafkaTopics.REPORTING_DLQ, KafkaTopics.FINANCE_DLQ -> "dead-letter";
            default -> "unknown";
        };
    }

    public static String dlqTopicFor(String sourceTopic) {
        if (KafkaTopics.FINANCE_INTEGRATION.equals(sourceTopic)) {
            return KafkaTopics.FINANCE_DLQ;
        }
        return KafkaTopics.REPORTING_DLQ;
    }
}
