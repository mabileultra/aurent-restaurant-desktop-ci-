package com.pos.reporting.config;

import com.pos.shared.kafka.KafkaEventContracts;
import lombok.RequiredArgsConstructor;
import org.apache.kafka.common.TopicPartition;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.kafka.listener.DeadLetterPublishingRecoverer;
import org.springframework.kafka.listener.DefaultErrorHandler;
import org.springframework.stereotype.Component;
import org.springframework.util.backoff.FixedBackOff;

@Component
@RequiredArgsConstructor
public class ReportingKafkaErrorHandlerFactory {

    private final KafkaTemplate<String, Object> dlqKafkaTemplate;

    public DefaultErrorHandler create() {
        DeadLetterPublishingRecoverer recoverer = new DeadLetterPublishingRecoverer(
            dlqKafkaTemplate,
            (record, ex) -> new TopicPartition(
                KafkaEventContracts.dlqTopicFor(record.topic()),
                record.partition()
            )
        );
        return new DefaultErrorHandler(recoverer, new FixedBackOff(1000L, 3L));
    }
}
