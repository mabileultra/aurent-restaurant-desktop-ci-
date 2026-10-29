package com.pos.restaurant.revenue.service;

import java.util.UUID;

/** Schedules outbox Kafka send after commit on an async pool — never on the HTTP thread. */
public interface RevenueOutboxDispatchService {

    void dispatchAfterCommit(UUID outboxId);
}
