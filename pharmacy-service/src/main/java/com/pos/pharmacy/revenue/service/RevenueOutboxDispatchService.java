package com.pos.pharmacy.revenue.service;

import java.util.UUID;

public interface RevenueOutboxDispatchService {

    /** Не блокирует поток кассы: отправка Kafka на отдельном пуле. */
    void dispatchAfterCommit(UUID outboxId);
}
