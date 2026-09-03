package com.pos.restaurant.revenue.service;

import com.pos.restaurant.revenue.domain.RevenueOutboxChannel;
import com.pos.restaurant.revenue.entity.RevenueOutbox;

public interface RevenueOutboxService {

    RevenueOutbox enqueue(
        RevenueOutboxChannel channel,
        String topic,
        String messageKey,
        String idempotencyKey,
        String payload
    );

    void trySend(java.util.UUID outboxId);

    int processPendingBatch();
}
