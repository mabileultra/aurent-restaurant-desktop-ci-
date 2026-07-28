package com.pos.reporting.client.impl;

import com.pos.reporting.client.PosCacheRefreshClient;
import io.github.resilience4j.circuitbreaker.annotation.CircuitBreaker;
import io.github.resilience4j.retry.annotation.Retry;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpHeaders;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;

@Component
@RequiredArgsConstructor
public class PosCacheRefreshClientImpl implements PosCacheRefreshClient {

    private static final String POS_CORE = "pos-core";

    private final RestClient posCoreRestClient;

    @Override
    @CircuitBreaker(name = POS_CORE)
    @Retry(name = POS_CORE)
    public void refresh(String authorization) {
        RestClient.RequestBodySpec spec = posCoreRestClient.post()
            .uri("/internal/reports/ops/cache/refresh");
        if (authorization != null && !authorization.isBlank()) {
            spec = spec.header(HttpHeaders.AUTHORIZATION, authorization);
        }
        spec.retrieve().toBodilessEntity();
    }
}
