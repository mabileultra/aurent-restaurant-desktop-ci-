package com.pos.catalog.event;

import com.pos.catalog.entity.CatalogOutbox;

/**
 * Transport for PENDING outbox rows. Kafka implementation can replace the logging default later.
 */
public interface CatalogOutboxPublisher {

    void publish(CatalogOutbox row);
}
