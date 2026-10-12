package com.pos.integrations.markingvalidation.config;

import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.web.client.RestClient;

import java.nio.charset.StandardCharsets;

@Configuration
@EnableConfigurationProperties(MarkingValidationProperties.class)
public class MarkingValidationConfig {

    @Bean
    RestClient markingValidationRestClient(MarkingValidationProperties properties) {
        SimpleClientHttpRequestFactory factory = new SimpleClientHttpRequestFactory();
        factory.setConnectTimeout(properties.getConnectTimeoutMs());
        factory.setReadTimeout(properties.getReadTimeoutMs());
        RestClient.Builder builder = RestClient.builder()
            .requestFactory(factory)
            .defaultHeader(HttpHeaders.ACCEPT, MediaType.APPLICATION_JSON_VALUE);
        if (properties.isConfigured()) {
            builder.defaultHeader(
                HttpHeaders.AUTHORIZATION,
                "Basic " + HttpHeaders.encodeBasicAuth(
                    properties.getUsername(), properties.getPassword(), StandardCharsets.UTF_8
                )
            );
        }
        return builder.build();
    }
}
