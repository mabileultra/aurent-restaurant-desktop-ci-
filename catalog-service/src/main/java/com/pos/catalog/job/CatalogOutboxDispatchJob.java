package com.pos.catalog.job;

import com.pos.catalog.config.CatalogOutboxProperties;
import com.pos.catalog.service.CatalogOutboxDispatchService;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
@ConditionalOnProperty(name = "app.outbox.dispatch-enabled", havingValue = "true", matchIfMissing = true)
public class CatalogOutboxDispatchJob {

    private final CatalogOutboxDispatchService dispatchService;
    private final CatalogOutboxProperties properties;

    @Scheduled(cron = "${app.outbox.dispatch-cron:*/15 * * * * *}")
    public void tick() {
        dispatchService.dispatchBatch(properties.getBatchSize());
    }
}
