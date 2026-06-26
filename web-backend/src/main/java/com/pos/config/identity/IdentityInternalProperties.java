package com.pos.config.identity;

import lombok.Getter;
import lombok.Setter;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

@Component
@ConfigurationProperties(prefix = "app.identity")
@Getter
@Setter
public class IdentityInternalProperties {

    private String baseUrl = "http://localhost:8081/api/v1";
    private String internalApiKey = "identity-internal-dev-key-change-in-prod";
    private int connectTimeoutMs = 5000;
    private int readTimeoutMs = 15000;
}
