package com.pos.config.crm;

import lombok.Getter;
import lombok.Setter;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

@Component
@ConfigurationProperties(prefix = "app.crm")
@Getter
@Setter
public class CrmInternalProperties {

    private String baseUrl = "http://localhost:8083/api/v1";
    private String internalApiKey = "crm-internal-dev-key-change-in-prod";
    private int connectTimeoutMs = 5000;
    private int readTimeoutMs = 15000;
}
