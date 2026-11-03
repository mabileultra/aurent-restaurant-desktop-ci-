package com.pos.catalog.config;

import lombok.Getter;
import lombok.Setter;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

@Component
@ConfigurationProperties(prefix = "app.kafka")
@Getter
@Setter
public class CatalogKafkaProperties {

    private String bootstrapServers = "localhost:19092";
    private long sendTimeoutMs = 10000;
}
