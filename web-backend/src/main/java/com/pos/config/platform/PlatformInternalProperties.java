package com.pos.config.platform;

import lombok.Getter;
import lombok.Setter;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

@Component
@ConfigurationProperties(prefix = "app.platform")
@Getter
@Setter
public class PlatformInternalProperties {

    private String baseUrl = "http://localhost:8084/api/v1";
    private String internalApiKey = "platform-internal-dev-key-change-in-prod";
    private int connectTimeoutMs = 5000;
    private int readTimeoutMs = 15000;
}
