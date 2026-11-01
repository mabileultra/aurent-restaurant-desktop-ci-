package com.pos.inventory.controller;

import com.pos.config.openapi.StandardApiResponses;
import com.pos.dto.report.stock.LowStockRowResponse;
import com.pos.dto.report.stock.StockBalanceRowResponse;
import com.pos.dto.shared.PageResponse;
import com.pos.inventory.service.stock.LiveStockReportService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

/**
 * Live stock reports from store_stock (not reporting_db facts).
 * Path under /warehouse so api-gateway does not send them to reporting-service.
 */
@RestController
@RequestMapping("/warehouse/reports")
@RequiredArgsConstructor
@PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
@Tag(name = "Live Stock Reports", description = "Остатки и low-stock из живого store_stock")
@StandardApiResponses
public class LiveStockReportController {

    private final LiveStockReportService liveStockReportService;

    @GetMapping("/balances")
    @Operation(summary = "Остатки товаров (live store_stock)")
    public ResponseEntity<PageResponse<StockBalanceRowResponse>> balances(
        @RequestParam(required = false) Integer storeId,
        @RequestParam(required = false) Integer categoryId,
        @RequestParam(required = false) String search,
        @RequestParam(defaultValue = "false") boolean onlyWithStock,
        @PageableDefault(size = 20) Pageable pageable
    ) {
        return ResponseEntity.ok(
            liveStockReportService.balances(storeId, categoryId, search, onlyWithStock, pageable)
        );
    }

    @GetMapping("/low-stock")
    @Operation(summary = "Товары ниже минимума (live store_stock)")
    public ResponseEntity<PageResponse<LowStockRowResponse>> lowStock(
        @PageableDefault(size = 20) Pageable pageable
    ) {
        return ResponseEntity.ok(liveStockReportService.lowStock(pageable));
    }
}
