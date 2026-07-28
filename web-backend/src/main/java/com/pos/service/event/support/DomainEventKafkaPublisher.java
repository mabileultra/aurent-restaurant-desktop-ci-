package com.pos.service.event.support;

import com.pos.config.kafka.DomainKafkaProperties;
import com.pos.shared.log.LogUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.kafka.support.SendResult;
import org.springframework.stereotype.Component;
import org.springframework.transaction.support.TransactionSynchronization;
import org.springframework.transaction.support.TransactionSynchronizationManager;

import java.util.concurrent.TimeUnit;

@Component
@RequiredArgsConstructor
@ConditionalOnProperty(prefix = "app.kafka.domain", name = "enabled", havingValue = "true", matchIfMissing = true)
public class DomainEventKafkaPublisher {

    private final KafkaTemplate<String, Object> domainEventKafkaTemplate;
    private final DomainKafkaProperties properties;

    public void publishAfterCommit(String topic, String key, Object event) {
        if (event == null) {
            return;
        }
        Runnable send = () -> sendNow(topic, key, event);
        if (!TransactionSynchronizationManager.isSynchronizationActive()) {
            send.run();
            return;
        }
        TransactionSynchronizationManager.registerSynchronization(new TransactionSynchronization() {
            @Override
            public void afterCommit() {
                send.run();
            }
        });
    }

    private void sendNow(String topic, String key, Object event) {
        try {
            SendResult<String, Object> result = domainEventKafkaTemplate
                .send(topic, key, event)
                .get(properties.getSendTimeoutMs(), TimeUnit.MILLISECONDS);
            LogUtil.info(
                DomainEventKafkaPublisher.class,
                "Domain event published: topic={}, key={}, partition={}",
                topic,
                key,
                result.getRecordMetadata().partition()
            );
        } catch (Exception ex) {
            LogUtil.warn(
                DomainEventKafkaPublisher.class,
                "Domain event publish failed: topic={}, key={}, error={}",
                topic,
                key,
                ex.getMessage()
            );
        }
    }
}
