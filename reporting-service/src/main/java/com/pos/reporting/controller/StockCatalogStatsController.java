package com.pos.reporting.controller;

import com.pos.reporting.dto.stock.StockCatalogStatsResponse;
import com.pos.reporting.service.StockCatalogStatsService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.core.annotation.Order;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/reports/stock")
@RequiredArgsConstructor
@Order(0)
@PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
@Tag(name = "Reporting Stock Catalog", description = "Сводные показатели каталога из reporting_db")
public class StockCatalogStatsController {

    private final StockCatalogStatsService stockCatalogStatsService;

    @GetMapping("/catalog-stats")
    @Operation(summary = "Активные SKU и низкие остатки")
    public ResponseEntity<StockCatalogStatsResponse> catalogStats() {
        return ResponseEntity.ok(stockCatalogStatsService.catalogStats());
    }
}
