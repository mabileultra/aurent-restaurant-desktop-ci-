package com.pos.config.reporting;

import lombok.Getter;
import lombok.Setter;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

@Component
@ConfigurationProperties(prefix = "app.reporting")
@Getter
@Setter
public class ReportingInternalProperties {

    private String baseUrl = "http://localhost:8085/api/v1";
    private String internalApiKey = "reporting-internal-dev-key-change-in-prod";
    private int connectTimeoutMs = 5000;
    private int readTimeoutMs = 30000;
}
