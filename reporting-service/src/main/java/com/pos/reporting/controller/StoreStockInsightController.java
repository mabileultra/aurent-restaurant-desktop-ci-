package com.pos.reporting.controller;

import com.pos.reporting.dto.analytics.StoreStockInsightResponse;
import com.pos.reporting.service.StoreStockInsightService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.core.annotation.Order;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDate;

@RestController
@RequestMapping("/reports/analytics")
@RequiredArgsConstructor
@Order(0)
@PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
@Tag(name = "Reporting Store Analytics", description = "Сводки продаж и остатков по магазинам")
public class StoreStockInsightController {

    private final StoreStockInsightService storeStockInsightService;

    @GetMapping("/store-stock-insight")
    @Operation(summary = "Продажи, остатки и проданные единицы по магазинам")
    public ResponseEntity<StoreStockInsightResponse> insight(
        @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
        @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to
    ) {
        return ResponseEntity.ok(storeStockInsightService.insight(from, to));
    }
}
