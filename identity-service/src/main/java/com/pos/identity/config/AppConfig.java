package com.pos.identity.config;

import com.pos.shared.http.InternalApiHeaders;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.client.RestClient;

@Configuration
public class AppConfig {

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    @Bean
    public RestClient posCoreRestClient(
        @Value("${app.pos-core.url}") String baseUrl,
        @Value("${app.internal.api-key}") String apiKey
    ) {
        return RestClient.builder()
            .baseUrl(baseUrl)
            .defaultHeader(InternalApiHeaders.API_KEY, apiKey)
            .build();
    }
}
