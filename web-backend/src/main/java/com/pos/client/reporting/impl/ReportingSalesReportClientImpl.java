package com.pos.client.reporting.impl;

import com.pos.client.reporting.ReportingSalesReportClient;
import com.pos.dto.report.DailySummaryResponse;
import com.pos.dto.report.ReturnsSummaryResponse;
import com.pos.dto.report.SalesReportResponse;
import com.pos.dto.report.TopProductRow;
import com.pos.dto.report.sales.StoreSalesRowResponse;
import com.pos.dto.shared.PageResponse;
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
public class ReportingSalesReportClientImpl implements ReportingSalesReportClient {

    private final RestClient reportingRestClient;
    private final HttpRequestAuthSupport httpRequestAuthSupport;

    @Override
    public SalesReportResponse salesReport(LocalDate from, LocalDate to) {
        return fetch(
            UriComponentsBuilder.fromPath("/reports/sales")
                .queryParam("from", from)
                .queryParam("to", to)
                .build()
                .toUriString(),
            new ParameterizedTypeReference<SalesReportResponse>() {}
        );
    }

    @Override
    public PageResponse<StoreSalesRowResponse> salesByStores(LocalDate from, LocalDate to, int page, int size) {
        String uri = UriComponentsBuilder.fromPath("/reports/sales/by-stores")
            .queryParam("from", from)
            .queryParam("to", to)
            .queryParam("page", Math.max(page, 0))
            .queryParam("size", Math.max(size, 1))
            .build()
            .toUriString();
        PageResponse<StoreSalesRowResponse> body = fetch(uri, new ParameterizedTypeReference<>() {});
        return body != null ? body : new PageResponse<>(List.of(), 0, 0L, size, page);
    }

    @Override
    public List<TopProductRow> topProducts(int limit, LocalDate from, LocalDate to) {
        String uri = UriComponentsBuilder.fromPath("/reports/top-products")
            .queryParam("limit", Math.max(1, limit))
            .queryParam("from", from)
            .queryParam("to", to)
            .build()
            .toUriString();
        List<TopProductRow> body = fetch(uri, new ParameterizedTypeReference<>() {});
        return body != null ? body : List.of();
    }

    @Override
    public ReturnsSummaryResponse returnsSummary(LocalDate from, LocalDate to) {
        String uri = UriComponentsBuilder.fromPath("/reports/sales/returns-summary")
            .queryParam("from", from)
            .queryParam("to", to)
            .build()
            .toUriString();
        ReturnsSummaryResponse body = fetch(uri, new ParameterizedTypeReference<ReturnsSummaryResponse>() {});
        return body != null ? body : new ReturnsSummaryResponse(0L, java.math.BigDecimal.ZERO);
    }

    @Override
    public DailySummaryResponse dailySummary(LocalDate date) {
        String uri = UriComponentsBuilder.fromPath("/reports/daily")
            .queryParam("date", date)
            .build()
            .toUriString();
        return fetch(uri, new ParameterizedTypeReference<DailySummaryResponse>() {});
    }

    private <T> T fetch(String uri, ParameterizedTypeReference<T> type) {
        RestClient.RequestHeadersSpec<?> spec = reportingRestClient.get().uri(uri);
        httpRequestAuthSupport.authorizationHeader()
            .ifPresent(value -> spec.header(HttpHeaders.AUTHORIZATION, value));
        return spec.retrieve().body(type);
    }
}
