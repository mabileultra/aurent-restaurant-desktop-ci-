package com.pos.client.reporting.impl;

import com.pos.client.reporting.ReportingShiftReportClient;
import com.pos.dto.report.shift.ShiftOverviewResponse;
import com.pos.service.support.HttpRequestAuthSupport;
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
public class ReportingShiftReportClientImpl implements ReportingShiftReportClient {

    private final RestClient reportingRestClient;
    private final HttpRequestAuthSupport httpRequestAuthSupport;

    @Override
    public ShiftOverviewResponse overview(LocalDate from, LocalDate to, int recentLimit) {
        String uri = UriComponentsBuilder.fromPath("/reports/shifts/overview")
            .queryParam("from", from)
            .queryParam("to", to)
            .queryParam("recentLimit", Math.max(1, recentLimit))
            .build()
            .toUriString();
        RestClient.RequestHeadersSpec<?> spec = reportingRestClient.get().uri(uri);
        httpRequestAuthSupport.authorizationHeader()
            .ifPresent(value -> spec.header(HttpHeaders.AUTHORIZATION, value));
        ShiftOverviewResponse body = spec.retrieve().body(new ParameterizedTypeReference<>() {});
        return body != null ? body : emptyOverview();
    }

    private static ShiftOverviewResponse emptyOverview() {
        return new ShiftOverviewResponse(0L, java.math.BigDecimal.ZERO, 0L, List.of());
    }
}
