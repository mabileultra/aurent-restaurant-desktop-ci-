package com.pos.config.restaurant;

import com.pos.shared.http.InternalApiHeaders;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.web.client.RestClient;

@Configuration
public class RestaurantRestClientConfig {

    @Bean
    public RestClient restaurantRestClient(RestaurantInternalProperties properties) {
        SimpleClientHttpRequestFactory factory = new SimpleClientHttpRequestFactory();
        factory.setConnectTimeout(properties.getConnectTimeoutMs());
        factory.setReadTimeout(properties.getReadTimeoutMs());
        // Trailing slash keeps relative paths under /api/v1 (avoids /api/v1internal/... 404).
        String baseUrl = properties.getBaseUrl();
        if (baseUrl != null && !baseUrl.isBlank() && !baseUrl.endsWith("/")) {
            baseUrl = baseUrl + "/";
        }
        return RestClient.builder()
            .baseUrl(baseUrl)
            .requestFactory(factory)
            .defaultHeader(InternalApiHeaders.API_KEY, properties.getInternalApiKey())
            .build();
    }
}
