package com.pos.ai.client.reporting.impl;

import com.pos.ai.client.reporting.ReportingShiftReportClient;
import com.pos.ai.dto.report.shift.ShiftOverviewResponse;
import com.pos.ai.support.HttpRequestAuthSupport;
import io.github.resilience4j.circuitbreaker.annotation.CircuitBreaker;
import io.github.resilience4j.retry.annotation.Retry;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;
import org.springframework.web.util.UriComponentsBuilder;

import java.time.LocalDate;
import java.util.List;

@Component
public class ReportingShiftReportClientImpl implements ReportingShiftReportClient {

    private static final String REPORTING_SERVICE = "reporting-service";

    private final RestClient reportingRestClient;
    private final HttpRequestAuthSupport httpRequestAuthSupport;

    public ReportingShiftReportClientImpl(
        @Qualifier("reportingRestClient") RestClient reportingRestClient,
        HttpRequestAuthSupport httpRequestAuthSupport
    ) {
        this.reportingRestClient = reportingRestClient;
        this.httpRequestAuthSupport = httpRequestAuthSupport;
    }

    @Override
    @CircuitBreaker(name = REPORTING_SERVICE)
    @Retry(name = REPORTING_SERVICE)
    public ShiftOverviewResponse overview(LocalDate from, LocalDate to, int recentLimit) {
        String uri = UriComponentsBuilder.fromPath("/reports/shifts/overview")
            .queryParam("from", from)
            .queryParam("to", to)
            .queryParam("recentLimit", Math.max(1, recentLimit))
            .build()
            .toUriString();
        RestClient.RequestHeadersSpec<?> spec = reportingRestClient.get().uri(uri);
        httpRequestAuthSupport.apply(spec);
        ShiftOverviewResponse body = spec.retrieve().body(new ParameterizedTypeReference<>() {});
        return body != null ? body : emptyOverview();
    }

    private static ShiftOverviewResponse emptyOverview() {
        return new ShiftOverviewResponse(0L, java.math.BigDecimal.ZERO, 0L, List.of());
    }
}
