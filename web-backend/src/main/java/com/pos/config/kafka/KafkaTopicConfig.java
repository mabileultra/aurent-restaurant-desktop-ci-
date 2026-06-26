package com.pos.config.kafka;

import com.pos.shared.kafka.KafkaTopics;
import org.apache.kafka.clients.admin.NewTopic;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.kafka.config.TopicBuilder;

@Configuration
public class KafkaTopicConfig {

    @Bean
    public NewTopic financeIntegrationTopic() {
        return TopicBuilder.name(KafkaTopics.FINANCE_INTEGRATION)
            .partitions(3)
            .replicas(1)
            .build();
    }

    @Bean
    public NewTopic salesCompletedTopic() {
        return TopicBuilder.name(KafkaTopics.SALES_COMPLETED)
            .partitions(3)
            .replicas(1)
            .build();
    }

    @Bean
    public NewTopic stockReceivedTopic() {
        return TopicBuilder.name(KafkaTopics.STOCK_RECEIVED)
            .partitions(3)
            .replicas(1)
            .build();
    }

    @Bean
    public NewTopic stockMovementRecordedTopic() {
        return TopicBuilder.name(KafkaTopics.STOCK_MOVEMENT_RECORDED)
            .partitions(3)
            .replicas(1)
            .build();
    }

    @Bean
    public NewTopic productSnapshotTopic() {
        return TopicBuilder.name(KafkaTopics.PRODUCT_SNAPSHOT)
            .partitions(3)
            .replicas(1)
            .build();
    }

    @Bean
    public NewTopic stockInventoryRecordedTopic() {
        return TopicBuilder.name(KafkaTopics.STOCK_INVENTORY_RECORDED)
            .partitions(3)
            .replicas(1)
            .build();
    }

    @Bean
    public NewTopic stockTransferRecordedTopic() {
        return TopicBuilder.name(KafkaTopics.STOCK_TRANSFER_RECORDED)
            .partitions(3)
            .replicas(1)
            .build();
    }

    @Bean
    public NewTopic shiftClosedTopic() {
        return TopicBuilder.name(KafkaTopics.SHIFT_CLOSED)
            .partitions(3)
            .replicas(1)
            .build();
    }

    @Bean
    public NewTopic reportingDlqTopic() {
        return TopicBuilder.name(KafkaTopics.REPORTING_DLQ)
            .partitions(3)
            .replicas(1)
            .build();
    }
}
