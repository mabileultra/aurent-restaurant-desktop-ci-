package com.pos.pharmacy.config;

import com.pos.shared.http.InternalApiHeaders;
import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.client.RestClient;

@Configuration
@RequiredArgsConstructor
public class PosCoreClientConfig {

    private final PosCoreClientProperties properties;

    @Bean
    public RestClient posCoreRestClient() {
        return RestClient.builder()
            .baseUrl(properties.getBaseUrl())
            .defaultHeader(InternalApiHeaders.API_KEY, properties.getInternalApiKey())
            .build();
    }
}
