package com.pos.pharmacy.config;

import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.web.client.RestClient;

@Configuration
@EnableConfigurationProperties(PharmacyTasnifProperties.class)
public class PharmacyTasnifConfig {

    @Bean
    RestClient pharmacyTasnifRestClient(PharmacyTasnifProperties properties) {
        SimpleClientHttpRequestFactory factory = new SimpleClientHttpRequestFactory();
        factory.setConnectTimeout(properties.getConnectTimeoutMs());
        factory.setReadTimeout(properties.getReadTimeoutMs());
        return RestClient.builder()
            .baseUrl(properties.getBaseUrl())
            .requestFactory(factory)
            .defaultHeader("Accept", "*/*")
            .build();
    }
}
