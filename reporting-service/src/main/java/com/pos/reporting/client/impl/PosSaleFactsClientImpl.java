package com.pos.reporting.client.impl;

import com.pos.reporting.client.PosSaleFactsClient;
import com.pos.reporting.dto.SaleFactsPageResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.http.HttpHeaders;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;
import org.springframework.web.util.UriComponentsBuilder;

import java.time.LocalDate;

@Component
@RequiredArgsConstructor
public class PosSaleFactsClientImpl implements PosSaleFactsClient {

    private final RestClient posCoreRestClient;

    @Override
    public SaleFactsPageResponse fetchPage(
        LocalDate from,
        LocalDate to,
        int page,
        int size,
        String authorization
    ) {
        String uri = UriComponentsBuilder.fromPath("/internal/reports/ops/sale-facts")
            .queryParam("from", from)
            .queryParam("to", to)
            .queryParam("page", page)
            .queryParam("size", size)
            .build()
            .toUriString();

        RestClient.RequestHeadersSpec<?> spec = posCoreRestClient.get().uri(uri);
        if (authorization != null && !authorization.isBlank()) {
            spec = spec.header(HttpHeaders.AUTHORIZATION, authorization);
        }
        return spec.retrieve().body(new ParameterizedTypeReference<SaleFactsPageResponse>() {});
    }
}
