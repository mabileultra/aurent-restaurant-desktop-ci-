package com.pos.reporting.client.impl;

import com.pos.reporting.client.PosReportingFactsClient;
import com.pos.reporting.dto.InventoryFactsPageResponse;
import com.pos.reporting.dto.MovementFactsPageResponse;
import com.pos.reporting.dto.ProductFactsPageResponse;
import com.pos.reporting.dto.ShiftFactsPageResponse;
import com.pos.reporting.dto.StockFactsPageResponse;
import com.pos.reporting.dto.TransferFactsPageResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.http.HttpHeaders;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;
import org.springframework.web.util.UriComponentsBuilder;

import java.time.LocalDate;

@Component
@RequiredArgsConstructor
public class PosReportingFactsClientImpl implements PosReportingFactsClient {

    private final RestClient posCoreRestClient;

    @Override
    public StockFactsPageResponse fetchStockPage(
        LocalDate from,
        LocalDate to,
        int page,
        int size,
        String authorization
    ) {
        return fetch("/internal/reports/ops/stock-facts", from, to, page, size, authorization,
            new ParameterizedTypeReference<StockFactsPageResponse>() {});
    }

    @Override
    public MovementFactsPageResponse fetchMovementPage(
        LocalDate from,
        LocalDate to,
        int page,
        int size,
        String authorization
    ) {
        return fetch("/internal/reports/ops/movement-facts", from, to, page, size, authorization,
            new ParameterizedTypeReference<MovementFactsPageResponse>() {});
    }

    @Override
    public ProductFactsPageResponse fetchProductSnapshotPage(int page, int size, String authorization) {
        String uri = UriComponentsBuilder.fromPath("/internal/reports/ops/product-snapshots")
            .queryParam("page", page)
            .queryParam("size", size)
            .build()
            .toUriString();

        RestClient.RequestHeadersSpec<?> spec = posCoreRestClient.get().uri(uri);
        if (authorization != null && !authorization.isBlank()) {
            spec = spec.header(HttpHeaders.AUTHORIZATION, authorization);
        }
        return spec.retrieve().body(new ParameterizedTypeReference<ProductFactsPageResponse>() {});
    }

    @Override
    public InventoryFactsPageResponse fetchInventoryPage(
        LocalDate from,
        LocalDate to,
        int page,
        int size,
        String authorization
    ) {
        return fetch("/internal/reports/ops/inventory-facts", from, to, page, size, authorization,
            new ParameterizedTypeReference<InventoryFactsPageResponse>() {});
    }

    @Override
    public TransferFactsPageResponse fetchTransferPage(
        LocalDate from,
        LocalDate to,
        int page,
        int size,
        String authorization
    ) {
        return fetch("/internal/reports/ops/transfer-facts", from, to, page, size, authorization,
            new ParameterizedTypeReference<TransferFactsPageResponse>() {});
    }

    @Override
    public ShiftFactsPageResponse fetchShiftPage(
        LocalDate from,
        LocalDate to,
        int page,
        int size,
        String authorization
    ) {
        return fetch("/internal/reports/ops/shift-facts", from, to, page, size, authorization,
            new ParameterizedTypeReference<ShiftFactsPageResponse>() {});
    }

    private <T> T fetch(
        String path,
        LocalDate from,
        LocalDate to,
        int page,
        int size,
        String authorization,
        ParameterizedTypeReference<T> type
    ) {
        String uri = UriComponentsBuilder.fromPath(path)
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
        return spec.retrieve().body(type);
    }
}
