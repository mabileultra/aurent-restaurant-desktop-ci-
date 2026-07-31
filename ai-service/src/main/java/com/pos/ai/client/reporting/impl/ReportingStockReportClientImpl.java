package com.pos.ai.client.reporting.impl;

import com.pos.ai.client.reporting.ReportingStockReportClient;
import com.pos.ai.dto.report.sales.ProductSalesRowResponse;
import com.pos.ai.dto.report.stock.DeadStockRowResponse;
import com.pos.ai.dto.report.stock.LowStockRowResponse;
import com.pos.ai.dto.report.stock.StockCatalogStatsResponse;
import com.pos.ai.dto.report.stock.StockInventoryRowResponse;
import com.pos.ai.dto.report.stock.StockTurnoverRowResponse;
import com.pos.ai.dto.shared.PageResponse;
import com.pos.ai.support.HttpRequestAuthSupport;
import io.github.resilience4j.circuitbreaker.annotation.CircuitBreaker;
import io.github.resilience4j.retry.annotation.Retry;
import lombok.RequiredArgsConstructor;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.http.HttpHeaders;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;
import org.springframework.web.util.UriComponentsBuilder;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

@Component
@RequiredArgsConstructor
public class ReportingStockReportClientImpl implements ReportingStockReportClient {

    private static final String REPORTING_SERVICE = "reporting-service";

    private final RestClient reportingRestClient;
    private final HttpRequestAuthSupport httpRequestAuthSupport;

    @Override
    @CircuitBreaker(name = REPORTING_SERVICE)
    @Retry(name = REPORTING_SERVICE)
    public StockCatalogStatsResponse catalogStats() {
        StockCatalogStatsResponse body = fetch(
            "/reports/stock/catalog-stats",
            List.of(),
            new ParameterizedTypeReference<StockCatalogStatsResponse>() {}
        );
        return body != null ? body : new StockCatalogStatsResponse(0L, 0L);
    }

    @Override
    @CircuitBreaker(name = REPORTING_SERVICE)
    @Retry(name = REPORTING_SERVICE)
    public PageResponse<LowStockRowResponse> lowStock(int page, int size) {
        return fetch(
            "/reports/stock/low-stock",
            List.of(pageParam(page), sizeParam(size)),
            new ParameterizedTypeReference<PageResponse<LowStockRowResponse>>() {}
        );
    }

    @Override
    @CircuitBreaker(name = REPORTING_SERVICE)
    @Retry(name = REPORTING_SERVICE)
    public PageResponse<StockInventoryRowResponse> inventories(
        LocalDate from,
        LocalDate to,
        Integer storeId,
        int page,
        int size
    ) {
        List<QueryParam> params = new ArrayList<>();
        params.add(new QueryParam("from", from));
        params.add(new QueryParam("to", to));
        if (storeId != null) {
            params.add(new QueryParam("storeId", storeId));
        }
        params.add(pageParam(page));
        params.add(sizeParam(size));
        return fetch(
            "/reports/stock/inventories",
            params,
            new ParameterizedTypeReference<PageResponse<StockInventoryRowResponse>>() {}
        );
    }

    @Override
    @CircuitBreaker(name = REPORTING_SERVICE)
    @Retry(name = REPORTING_SERVICE)
    public PageResponse<StockTurnoverRowResponse> turnover(
        LocalDate from,
        LocalDate to,
        Integer categoryId,
        String search,
        int page,
        int size
    ) {
        List<QueryParam> params = new ArrayList<>();
        params.add(new QueryParam("from", from));
        params.add(new QueryParam("to", to));
        if (categoryId != null) {
            params.add(new QueryParam("categoryId", categoryId));
        }
        if (search != null && !search.isBlank()) {
            params.add(new QueryParam("search", search));
        }
        params.add(pageParam(page));
        params.add(sizeParam(size));
        return fetch(
            "/reports/stock/turnover",
            params,
            new ParameterizedTypeReference<PageResponse<StockTurnoverRowResponse>>() {}
        );
    }

    @Override
    @CircuitBreaker(name = REPORTING_SERVICE)
    @Retry(name = REPORTING_SERVICE)
    public PageResponse<ProductSalesRowResponse> productSales(
        LocalDate from,
        LocalDate to,
        Integer storeId,
        Integer categoryId,
        String search,
        int page,
        int size
    ) {
        List<QueryParam> params = new ArrayList<>();
        params.add(new QueryParam("from", from));
        params.add(new QueryParam("to", to));
        if (storeId != null) {
            params.add(new QueryParam("storeId", storeId));
        }
        if (categoryId != null) {
            params.add(new QueryParam("categoryId", categoryId));
        }
        if (search != null && !search.isBlank()) {
            params.add(new QueryParam("search", search));
        }
        params.add(pageParam(page));
        params.add(sizeParam(size));
        return fetch(
            "/reports/sales/by-products",
            params,
            new ParameterizedTypeReference<PageResponse<ProductSalesRowResponse>>() {}
        );
    }

    @Override
    @CircuitBreaker(name = REPORTING_SERVICE)
    @Retry(name = REPORTING_SERVICE)
    public PageResponse<DeadStockRowResponse> deadStock(
        LocalDate asOfDate,
        int daysNoSale,
        Integer categoryId,
        String search,
        int page,
        int size
    ) {
        List<QueryParam> params = new ArrayList<>();
        if (asOfDate != null) {
            params.add(new QueryParam("asOfDate", asOfDate));
        }
        params.add(new QueryParam("daysNoSale", daysNoSale));
        if (categoryId != null) {
            params.add(new QueryParam("categoryId", categoryId));
        }
        if (search != null && !search.isBlank()) {
            params.add(new QueryParam("search", search));
        }
        params.add(pageParam(page));
        params.add(sizeParam(size));
        return fetch(
            "/reports/stock/dead-stock",
            params,
            new ParameterizedTypeReference<PageResponse<DeadStockRowResponse>>() {}
        );
    }

    private <T> T fetch(String path, List<QueryParam> params, ParameterizedTypeReference<T> type) {
        UriComponentsBuilder builder = UriComponentsBuilder.fromPath(path);
        for (QueryParam param : params) {
            builder.queryParam(param.name(), param.value());
        }
        RestClient.RequestHeadersSpec<?> spec = reportingRestClient.get().uri(builder.build().toUriString());
        httpRequestAuthSupport.authorizationHeader()
            .ifPresent(value -> spec.header(HttpHeaders.AUTHORIZATION, value));
        T body = spec.retrieve().body(type);
        return body != null ? body : emptyPage(type);
    }

    private static QueryParam pageParam(int page) {
        return new QueryParam("page", Math.max(page, 0));
    }

    private static QueryParam sizeParam(int size) {
        return new QueryParam("size", Math.max(size, 1));
    }

    @SuppressWarnings("unchecked")
    private static <T> T emptyPage(ParameterizedTypeReference<T> type) {
        return (T) new PageResponse<>(List.of(), 0, 0L, 0, 0);
    }

    private record QueryParam(String name, Object value) {
    }
}
