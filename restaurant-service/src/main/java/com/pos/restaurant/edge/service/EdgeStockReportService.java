package com.pos.restaurant.edge.service;

import lombok.RequiredArgsConstructor;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.Map;

/**
 * Facade for edge stock reports — delegates to snapshot vs document report services.
 */
@Service
@RequiredArgsConstructor
@ConditionalOnProperty(prefix = "app.restaurant.edge", name = "enabled", havingValue = "true")
public class EdgeStockReportService {

    private final EdgeStockSnapshotReportService snapshots;
    private final EdgeStockDocReportService docs;

    public Map<String, Object> dashboard(LocalDate from, LocalDate to, Integer storeId) {
        return snapshots.dashboard(from, to, storeId);
    }

    public Map<String, Object> balances(Integer storeId, String search, Boolean onlyWithStock, int page, int size) {
        return snapshots.balances(storeId, search, onlyWithStock, page, size);
    }

    public Map<String, Object> lowStock(int page, int size) {
        return snapshots.lowStock(page, size);
    }

    public Map<String, Object> movements(
        LocalDate from, LocalDate to, Integer storeId, String search, String movementType, int page, int size
    ) {
        return docs.movements(from, to, storeId, search, movementType, page, size);
    }

    public Map<String, Object> docsByType(String type, LocalDate from, LocalDate to, Integer storeId, int page, int size) {
        return docs.docsByType(type, from, to, storeId, page, size);
    }

    public Map<String, Object> transfers(LocalDate from, LocalDate to, Integer storeId, int page, int size) {
        return docs.transfers(from, to, storeId, page, size);
    }
}
