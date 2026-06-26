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
    String payload
) {
}
