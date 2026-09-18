package com.pos.finance.kafka;

import com.pos.finance.integration.service.FinanceIntegrationInboxService;
import com.pos.finance.service.integration.FinanceIntegrationDispatcher;
import com.pos.shared.kafka.FinanceIntegrationMessage;
import com.pos.shared.kafka.KafkaTopics;
import com.pos.shared.log.LogUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
@ConditionalOnProperty(prefix = "app.kafka.consumer", name = "enabled", havingValue = "true", matchIfMissing = true)
public class FinanceIntegrationKafkaListener {

    private final FinanceIntegrationDispatcher dispatcher;
    private final FinanceIntegrationInboxService inboxService;

    @KafkaListener(
        topics = KafkaTopics.FINANCE_INTEGRATION,
        groupId = "finance-integration-consumer",
        containerFactory = "financeIntegrationKafkaListenerContainerFactory"
    )
    public void onMessage(FinanceIntegrationMessage message) {
        if (message == null || message.targetPath() == null || message.payload() == null) {
            LogUtil.warn(FinanceIntegrationKafkaListener.class, "Skipping invalid finance integration message");
            return;
        }
        if (inboxService.alreadyProcessed(message.idempotencyKey())) {
            LogUtil.info(
                FinanceIntegrationKafkaListener.class,
                "Skip duplicate finance Kafka event key={}",
                message.idempotencyKey()
            );
            return;
        }
        LogUtil.info(
            FinanceIntegrationKafkaListener.class,
            "Kafka finance event received: type={}, key={}, schema={}",
            message.eventType(),
            message.idempotencyKey(),
            message.schemaVersion()
        );
        dispatcher.dispatch(message.targetPath(), message.payload());
        inboxService.markProcessed(message.idempotencyKey(), message.eventType());
    }
}
