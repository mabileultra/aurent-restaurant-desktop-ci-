package com.pos.pharmacy.revenue.service;

import com.pos.pharmacy.revenue.domain.RevenueOutboxChannel;
import com.pos.pharmacy.revenue.entity.RevenueOutbox;

import java.util.UUID;

public interface RevenueOutboxService {

    RevenueOutbox enqueue(
        RevenueOutboxChannel channel,
        String topic,
        String messageKey,
        String idempotencyKey,
        String payload
    );

    void trySend(UUID outboxId);

    int processPendingBatch();
}
