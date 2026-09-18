package com.pos.pharmacy.config;

import lombok.Getter;
import lombok.Setter;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

@Component
@ConfigurationProperties(prefix = "app.pos-core")
@Getter
@Setter
public class PosCoreClientProperties {

    private String baseUrl = "http://localhost:8080/api/v1";
    private String internalApiKey = "pos-internal-dev-key-change-in-prod";
}
