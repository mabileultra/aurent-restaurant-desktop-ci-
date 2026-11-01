package com.pos.config.restaurant;

import lombok.Getter;
import lombok.Setter;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

@Component
@ConfigurationProperties(prefix = "app.restaurant")
@Getter
@Setter
public class RestaurantInternalProperties {

    /** Inbound key (restaurant → pos stock consume). Same secret used outbound for store mirror. */
    private String internalApiKey = "pos-internal-dev-key-change-in-prod";

    private String baseUrl = "http://localhost:8087/api/v1";
    private int connectTimeoutMs = 3000;
    private int readTimeoutMs = 8000;
}
