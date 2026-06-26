package com.pos.reporting.client.impl;

import com.pos.reporting.client.PosCacheRefreshClient;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpHeaders;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;

@Component
@RequiredArgsConstructor
public class PosCacheRefreshClientImpl implements PosCacheRefreshClient {

    private final RestClient posCoreRestClient;

    @Override
    public void refresh(String authorization) {
        RestClient.RequestBodySpec spec = posCoreRestClient.post()
            .uri("/internal/reports/ops/cache/refresh");
        if (authorization != null && !authorization.isBlank()) {
            spec = spec.header(HttpHeaders.AUTHORIZATION, authorization);
        }
        spec.retrieve().toBodilessEntity();
    }
}
