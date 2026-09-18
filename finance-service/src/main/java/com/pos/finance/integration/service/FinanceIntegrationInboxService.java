package com.pos.finance.integration.service;

/**
 * Durable dedup по Kafka idempotencyKey.
 */
public interface FinanceIntegrationInboxService {

    boolean alreadyProcessed(String idempotencyKey);

    /** Фиксирует успех после dispatch (идемпотентно при гонке). */
    void markProcessed(String idempotencyKey, String eventType);
}
