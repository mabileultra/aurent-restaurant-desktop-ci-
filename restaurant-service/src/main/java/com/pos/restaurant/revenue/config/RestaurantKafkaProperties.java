package com.pos.restaurant.revenue.config;

import lombok.Getter;
import lombok.Setter;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

@Getter
@Setter
@Component
@ConfigurationProperties(prefix = "app.kafka")
public class RestaurantKafkaProperties {

    private boolean enabled = true;
    private String bootstrapServers = "localhost:19092";
    private long sendTimeoutMs = 10_000L;
    private long retryMs = 30_000L;
}
