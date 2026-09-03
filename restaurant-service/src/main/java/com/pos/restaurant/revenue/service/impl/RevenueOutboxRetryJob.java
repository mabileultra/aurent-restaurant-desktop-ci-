package com.pos.restaurant.revenue.service.impl;

import com.pos.restaurant.revenue.service.RevenueOutboxService;
import lombok.RequiredArgsConstructor;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class RevenueOutboxRetryJob {

    private final RevenueOutboxService outboxService;

    @Scheduled(fixedDelayString = "${app.kafka.retry-ms:30000}")
    public void retryPending() {
        outboxService.processPendingBatch();
    }
}
