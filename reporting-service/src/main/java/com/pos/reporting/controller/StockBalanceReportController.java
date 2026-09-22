package com.pos.reporting.controller;

import com.pos.reporting.dto.PageResponse;
import com.pos.reporting.dto.stock.pos.PosStockBalanceRow;
import com.pos.reporting.service.StockBalanceReportService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.core.annotation.Order;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/reports/stock")
@RequiredArgsConstructor
@Order(0)
@PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
@Tag(name = "Reporting Stock Balances", description = "Остатки товаров из reporting_db")
public class StockBalanceReportController {

    private final StockBalanceReportService stockBalanceReportService;

    @GetMapping("/balances")
    @Operation(summary = "Остатки товаров (reporting_db)")
    public ResponseEntity<PageResponse<PosStockBalanceRow>> balances(
        @RequestParam(required = false) Integer storeId,
        @RequestParam(required = false) Integer categoryId,
        @RequestParam(required = false) String search,
        @RequestParam(defaultValue = "false") boolean onlyWithStock,
        @PageableDefault(size = 20) Pageable pageable
    ) {
        return ResponseEntity.ok(
            stockBalanceReportService.balances(storeId, categoryId, search, onlyWithStock, pageable)
        );
    }
}
