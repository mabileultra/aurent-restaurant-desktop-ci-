package com.pos.crm.config;

import com.pos.shared.http.InternalApiHeaders;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.web.client.RestClient;

@Configuration
public class AppConfig {

    @Bean
    public RestClient posCoreRestClient(
        @Value("${app.pos-core.url}") String baseUrl,
        @Value("${app.internal.api-key}") String apiKey,
        @Value("${app.pos-core.connect-timeout-ms}") int connectTimeoutMs,
        @Value("${app.pos-core.read-timeout-ms}") int readTimeoutMs
    ) {
        SimpleClientHttpRequestFactory factory = new SimpleClientHttpRequestFactory();
        factory.setConnectTimeout(connectTimeoutMs);
        factory.setReadTimeout(readTimeoutMs);
        return RestClient.builder()
            .baseUrl(baseUrl)
            .requestFactory(factory)
            .defaultHeader(InternalApiHeaders.API_KEY, apiKey)
            .build();
    }
}
