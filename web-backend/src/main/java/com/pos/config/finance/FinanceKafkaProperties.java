package com.pos.config.finance;

import com.pos.shared.kafka.KafkaTopics;
import lombok.Getter;
import lombok.Setter;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

@Getter
@Setter
@Component
@ConfigurationProperties(prefix = "app.finance.kafka")
public class FinanceKafkaProperties {

    private boolean enabled = true;
    private String bootstrapServers = "localhost:19092";
    private String topic = KafkaTopics.FINANCE_INTEGRATION;
    private long sendTimeoutMs = 10_000L;
}
