package com.pos.config.kafka;

import lombok.Getter;
import lombok.Setter;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

@Getter
@Setter
@Component
@ConfigurationProperties(prefix = "app.kafka.domain")
public class DomainKafkaProperties {

    private boolean enabled = true;
    private String bootstrapServers = "localhost:19092";
    private long sendTimeoutMs = 10_000L;
}
