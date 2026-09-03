package com.pos.restaurant.revenue.config;

import lombok.Getter;
import lombok.Setter;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

@Getter
@Setter
@Component
@ConfigurationProperties(prefix = "app.pos")
public class PosCoreProperties {

    private boolean enabled = true;
    private String baseUrl = "http://localhost:8080/api/v1";
    private String internalApiKey = "pos-internal-dev-key-change-in-prod";
    private int connectTimeoutMs = 5000;
    private int readTimeoutMs = 15000;
}
