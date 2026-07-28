package com.pos.client.reporting.impl;

import com.pos.client.reporting.ReportingAnalyticsClient;
import com.pos.dto.report.analytics.StoreStockInsightResponse;
import com.pos.service.support.HttpRequestAuthSupport;
import io.github.resilience4j.circuitbreaker.annotation.CircuitBreaker;
import io.github.resilience4j.retry.annotation.Retry;
import lombok.RequiredArgsConstructor;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.http.HttpHeaders;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;
import org.springframework.web.util.UriComponentsBuilder;

import java.time.LocalDate;
import java.util.List;

@Component
@RequiredArgsConstructor
public class ReportingAnalyticsClientImpl implements ReportingAnalyticsClient {

    private static final String REPORTING_SERVICE = "reporting-service";

    private final RestClient reportingRestClient;
    private final HttpRequestAuthSupport httpRequestAuthSupport;

    @Override
    @CircuitBreaker(name = REPORTING_SERVICE)
    @Retry(name = REPORTING_SERVICE)
    public StoreStockInsightResponse storeStockInsight(LocalDate from, LocalDate to) {
        String uri = UriComponentsBuilder.fromPath("/reports/analytics/store-stock-insight")
            .queryParam("from", from)
            .queryParam("to", to)
            .build()
            .toUriString();
        RestClient.RequestHeadersSpec<?> spec = reportingRestClient.get().uri(uri);
        httpRequestAuthSupport.authorizationHeader()
            .ifPresent(value -> spec.header(HttpHeaders.AUTHORIZATION, value));
        StoreStockInsightResponse body = spec.retrieve().body(new ParameterizedTypeReference<>() {});
        return body != null ? body : emptyInsight();
    }

    private static StoreStockInsightResponse emptyInsight() {
        return new StoreStockInsightResponse(List.of(), List.of(), List.of(), List.of());
    }
}
