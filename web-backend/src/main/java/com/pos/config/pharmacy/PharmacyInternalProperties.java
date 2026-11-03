package com.pos.config.pharmacy;

import lombok.Getter;
import lombok.Setter;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

@Component
@ConfigurationProperties(prefix = "app.pharmacy")
@Getter
@Setter
public class PharmacyInternalProperties {

    private String baseUrl = "http://localhost:8089/api/v1";
    private String internalApiKey = "pos-internal-dev-key-change-in-prod";
    private int connectTimeoutMs = 3000;
    private int readTimeoutMs = 12000;
}
