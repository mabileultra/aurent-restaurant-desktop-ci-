package com.pos.restaurant.config;

import lombok.Getter;
import lombok.Setter;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

@Getter
@Setter
@Component
@ConfigurationProperties(prefix = "app.restaurant.edge")
public class RestaurantEdgeProperties {

    /** true when running as hall-PC edge (no cloud Redis/Kafka/POS). */
    private boolean enabled = false;
}
