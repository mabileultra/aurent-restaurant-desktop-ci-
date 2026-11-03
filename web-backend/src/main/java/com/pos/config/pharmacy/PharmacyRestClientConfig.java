package com.pos.config.pharmacy;

import com.pos.shared.http.InternalApiHeaders;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.web.client.RestClient;

@Configuration
public class PharmacyRestClientConfig {

    @Bean
    public RestClient pharmacyRestClient(PharmacyInternalProperties properties) {
        SimpleClientHttpRequestFactory factory = new SimpleClientHttpRequestFactory();
        factory.setConnectTimeout(properties.getConnectTimeoutMs());
        factory.setReadTimeout(properties.getReadTimeoutMs());
        return RestClient.builder()
            .baseUrl(properties.getBaseUrl())
            .requestFactory(factory)
            .defaultHeader(InternalApiHeaders.API_KEY, properties.getInternalApiKey())
            .build();
    }
}
