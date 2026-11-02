package com.pos.catalog.event;

import com.pos.catalog.entity.CatalogOutbox;
import com.pos.shared.log.LogUtil;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Component;

/**
 * Dev/default transport: acknowledges outbox without Kafka.
 * Enable real broker later via {@code app.outbox.transport=kafka}.
 */
@Component
@ConditionalOnProperty(name = "app.outbox.transport", havingValue = "logging", matchIfMissing = true)
public class LoggingCatalogOutboxPublisher implements CatalogOutboxPublisher {

    @Override
    public void publish(CatalogOutbox row) {
        LogUtil.info(
            LoggingCatalogOutboxPublisher.class,
            "catalog outbox publish type={} aggregateId={} companyId={} key={}",
            row.getEventType(),
            row.getAggregateId(),
            row.getCompanyId(),
            row.getIdempotencyKey()
        );
    }
}
