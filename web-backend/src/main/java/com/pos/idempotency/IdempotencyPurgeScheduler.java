package com.pos.idempotency;

import lombok.RequiredArgsConstructor;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class IdempotencyPurgeScheduler {

    private final IdempotencyService idempotencyService;

    @Scheduled(fixedDelayString = "${app.idempotency.purge-delay-ms:3600000}")
    public void purgeExpired() {
        idempotencyService.purgeExpired();
    }
}
