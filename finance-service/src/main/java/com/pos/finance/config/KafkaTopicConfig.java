package com.pos.finance.config;

import com.pos.shared.kafka.KafkaTopics;
import org.apache.kafka.clients.admin.NewTopic;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.kafka.config.TopicBuilder;

@Configuration
@ConditionalOnProperty(prefix = "app.kafka.consumer", name = "enabled", havingValue = "true", matchIfMissing = true)
public class KafkaTopicConfig {

    @Bean
    public NewTopic financeDlqTopic() {
        return TopicBuilder.name(KafkaTopics.FINANCE_DLQ)
            .partitions(3)
            .replicas(1)
            .build();
    }
}
