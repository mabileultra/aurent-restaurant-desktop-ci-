package com.pos.reporting.client.impl;

import com.pos.reporting.client.PosReportingFactsClient;
import com.pos.reporting.dto.InventoryFactsPageResponse;
import com.pos.reporting.dto.MovementFactsPageResponse;
import com.pos.reporting.dto.ProductFactsPageResponse;
import com.pos.reporting.dto.ShiftFactsPageResponse;
import com.pos.reporting.dto.StockFactsPageResponse;
import com.pos.reporting.dto.TransferFactsPageResponse;
import io.github.resilience4j.circuitbreaker.annotation.CircuitBreaker;
import io.github.resilience4j.retry.annotation.Retry;
import lombok.RequiredArgsConstructor;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;
import org.springframework.web.util.UriComponentsBuilder;

import java.time.LocalDate;

@Component
@RequiredArgsConstructor
public class PosReportingFactsClientImpl implements PosReportingFactsClient {

    private static final String POS_CORE = "pos-core";

    private final RestClient posCoreRestClient;

    @Override
    @CircuitBreaker(name = POS_CORE)
    @Retry(name = POS_CORE)
    public StockFactsPageResponse fetchStockPage(LocalDate from, LocalDate to, int page, int size) {
        return fetch("/internal/reports/ops/stock-facts", from, to, page, size,
            new ParameterizedTypeReference<>() {});
    }

    @Override
    @CircuitBreaker(name = POS_CORE)
    @Retry(name = POS_CORE)
    public MovementFactsPageResponse fetchMovementPage(LocalDate from, LocalDate to, int page, int size) {
        return fetch("/internal/reports/ops/movement-facts", from, to, page, size,
            new ParameterizedTypeReference<>() {});
    }

    @Override
    @CircuitBreaker(name = POS_CORE)
    @Retry(name = POS_CORE)
    public ProductFactsPageResponse fetchProductSnapshotPage(int page, int size) {
        String uri = UriComponentsBuilder.fromPath("/internal/reports/ops/product-snapshots")
            .queryParam("page", page)
            .queryParam("size", size)
            .build()
            .toUriString();
        return posCoreRestClient.get()
            .uri(uri)
            .retrieve()
            .body(new ParameterizedTypeReference<>() {});
    }

    @Override
    @CircuitBreaker(name = POS_CORE)
    @Retry(name = POS_CORE)
    public InventoryFactsPageResponse fetchInventoryPage(LocalDate from, LocalDate to, int page, int size) {
        return fetch("/internal/reports/ops/inventory-facts", from, to, page, size,
            new ParameterizedTypeReference<>() {});
    }

    @Override
    @CircuitBreaker(name = POS_CORE)
    @Retry(name = POS_CORE)
    public TransferFactsPageResponse fetchTransferPage(LocalDate from, LocalDate to, int page, int size) {
        return fetch("/internal/reports/ops/transfer-facts", from, to, page, size,
            new ParameterizedTypeReference<>() {});
    }

    @Override
    @CircuitBreaker(name = POS_CORE)
    @Retry(name = POS_CORE)
    public ShiftFactsPageResponse fetchShiftPage(LocalDate from, LocalDate to, int page, int size) {
        return fetch("/internal/reports/ops/shift-facts", from, to, page, size,
            new ParameterizedTypeReference<>() {});
    }

    private <T> T fetch(
        String path,
        LocalDate from,
        LocalDate to,
        int page,
        int size,
        ParameterizedTypeReference<T> type
    ) {
        String uri = UriComponentsBuilder.fromPath(path)
            .queryParam("from", from)
            .queryParam("to", to)
            .queryParam("page", page)
            .queryParam("size", size)
            .build()
            .toUriString();
        return posCoreRestClient.get().uri(uri).retrieve().body(type);
    }
}
