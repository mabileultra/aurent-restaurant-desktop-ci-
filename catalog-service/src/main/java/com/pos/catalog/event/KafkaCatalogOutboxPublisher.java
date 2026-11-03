package com.pos.catalog.event;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.pos.catalog.config.CatalogKafkaProperties;
import com.pos.catalog.entity.CatalogOutbox;
import com.pos.shared.event.ProductSnapshotEvent;
import com.pos.shared.kafka.KafkaTopics;
import com.pos.shared.log.LogUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.stereotype.Component;

import java.util.concurrent.TimeUnit;

@Component
@RequiredArgsConstructor
@ConditionalOnProperty(name = "app.outbox.transport", havingValue = "kafka")
public class KafkaCatalogOutboxPublisher implements CatalogOutboxPublisher {

    private final KafkaTemplate<String, Object> catalogKafkaTemplate;
    private final CatalogKafkaProperties kafkaProperties;
    private final ObjectMapper objectMapper;

    @Override
    public void publish(CatalogOutbox row) {
        if (row == null) {
            return;
        }
        String topic = resolveTopic(row.getEventType());
        String key = row.getAggregateId() != null ? row.getAggregateId().toString() : row.getIdempotencyKey();
        Object event = deserialize(row);
        try {
            catalogKafkaTemplate
                .send(topic, key, event)
                .get(kafkaProperties.getSendTimeoutMs(), TimeUnit.MILLISECONDS);
            LogUtil.info(
                KafkaCatalogOutboxPublisher.class,
                "catalog outbox kafka ok topic={} key={} type={}",
                topic,
                key,
                row.getEventType()
            );
        } catch (Exception ex) {
            throw new IllegalStateException(
                "Kafka publish failed topic=" + topic + " key=" + key + ": " + ex.getMessage(),
                ex
            );
        }
    }

    private Object deserialize(CatalogOutbox row) {
        try {
            if (CatalogEventTypes.PRODUCT_SNAPSHOT.equals(row.getEventType())) {
                return objectMapper.readValue(row.getPayload(), ProductSnapshotEvent.class);
            }
            return objectMapper.readTree(row.getPayload());
        } catch (Exception ex) {
            throw new IllegalStateException("Invalid outbox payload id=" + row.getId(), ex);
        }
    }

    private static String resolveTopic(String eventType) {
        if (CatalogEventTypes.PRODUCT_SNAPSHOT.equals(eventType)) {
            return KafkaTopics.PRODUCT_SNAPSHOT;
        }
        throw new IllegalArgumentException("Unsupported catalog outbox eventType=" + eventType);
    }
}
