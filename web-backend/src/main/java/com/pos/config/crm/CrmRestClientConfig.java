package com.pos.config.crm;

import com.pos.shared.http.InternalApiHeaders;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.web.client.RestClient;

@Configuration
public class CrmRestClientConfig {

    @Bean
    public RestClient crmRestClient(CrmInternalProperties properties) {
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
