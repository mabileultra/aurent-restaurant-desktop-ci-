package com.pos.shared.kafka;

import java.util.UUID;

/**
 * Сообщение outbox POS → finance-service (топик {@link KafkaTopics#FINANCE_INTEGRATION}).
 */
public record FinanceIntegrationMessage(
    UUID outboxId,
    String eventType,
    String targetPath,
    String idempotencyKey,
    String payload,
    Integer schemaVersion
) {
    public FinanceIntegrationMessage {
        if (schemaVersion == null || schemaVersion < 1) {
            schemaVersion = KafkaEventContracts.CURRENT_SCHEMA_VERSION;
        }
    }

    public FinanceIntegrationMessage(
        UUID outboxId,
        String eventType,
        String targetPath,
        String idempotencyKey,
        String payload
    ) {
        this(outboxId, eventType, targetPath, idempotencyKey, payload, KafkaEventContracts.CURRENT_SCHEMA_VERSION);
    }
}
