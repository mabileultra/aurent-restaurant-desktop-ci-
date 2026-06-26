package com.pos.finance.kafka;

import com.pos.finance.service.integration.FinanceIntegrationDispatcher;
import com.pos.finance.util.LogUtil;
import com.pos.shared.kafka.FinanceIntegrationMessage;
import com.pos.shared.kafka.KafkaTopics;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
@ConditionalOnProperty(prefix = "app.kafka.consumer", name = "enabled", havingValue = "true", matchIfMissing = true)
public class FinanceIntegrationKafkaListener {

    private final FinanceIntegrationDispatcher dispatcher;

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
        LogUtil.info(
            FinanceIntegrationKafkaListener.class,
            "Kafka finance event received: type={}, key={}",
            message.eventType(),
            message.idempotencyKey()
        );
        dispatcher.dispatch(message.targetPath(), message.payload());
    }
}
