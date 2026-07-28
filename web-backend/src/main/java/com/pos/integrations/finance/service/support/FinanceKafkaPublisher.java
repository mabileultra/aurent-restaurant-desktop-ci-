package com.pos.integrations.finance.service.support;

import com.pos.integrations.finance.config.FinanceKafkaProperties;
import com.pos.integrations.finance.entity.FinanceSyncOutbox;
import com.pos.shared.kafka.FinanceIntegrationMessage;
import com.pos.shared.log.LogUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.kafka.support.SendResult;
import org.springframework.stereotype.Component;

import java.util.concurrent.TimeUnit;

@Component
@RequiredArgsConstructor
@ConditionalOnProperty(prefix = "app.finance.kafka", name = "enabled", havingValue = "true", matchIfMissing = true)
public class FinanceKafkaPublisher {

    private final KafkaTemplate<String, FinanceIntegrationMessage> kafkaTemplate;
    private final FinanceKafkaProperties kafkaProperties;

    public boolean publish(FinanceSyncOutbox row) {
        if (!kafkaProperties.isEnabled()) {
            return false;
        }
        FinanceIntegrationMessage message = new FinanceIntegrationMessage(
            row.getId(),
            row.getEventType(),
            row.getTargetPath(),
            row.getIdempotencyKey(),
            row.getPayload()
        );
        try {
            SendResult<String, FinanceIntegrationMessage> result = kafkaTemplate
                .send(kafkaProperties.getTopic(), row.getIdempotencyKey(), message)
                .get(kafkaProperties.getSendTimeoutMs(), TimeUnit.MILLISECONDS);
            LogUtil.info(
                FinanceKafkaPublisher.class,
                "Finance event published to Kafka: key={}, partition={}",
                row.getIdempotencyKey(),
                result.getRecordMetadata().partition()
            );
            return true;
        } catch (Exception ex) {
            LogUtil.warn(
                FinanceKafkaPublisher.class,
                "Kafka publish failed: key={}, error={}",
                row.getIdempotencyKey(),
                ex.getMessage()
            );
            return false;
        }
    }
}
