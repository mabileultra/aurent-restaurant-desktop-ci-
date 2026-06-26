package com.pos.reporting.controller;

import com.pos.reporting.dto.PageResponse;
import com.pos.reporting.dto.stock.pos.PosStockMovementRow;
import com.pos.reporting.service.StockAdjustmentReportService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.core.annotation.Order;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDate;

@RestController
@RequestMapping("/reports/stock")
@RequiredArgsConstructor
@Order(0)
@PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
@Tag(name = "Reporting Stock Adjustments", description = "Корректировки остатков из reporting_db")
public class StockAdjustmentReportController {

    private final StockAdjustmentReportService stockAdjustmentReportService;

    @GetMapping("/adjustments")
    @Operation(summary = "Корректировки остатков (reporting_db)")
    public ResponseEntity<PageResponse<PosStockMovementRow>> adjustments(
        @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
        @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to,
        @RequestParam(required = false) Integer storeId,
        @RequestParam(required = false) String search,
        @PageableDefault(size = 30) Pageable pageable
    ) {
        return ResponseEntity.ok(
            stockAdjustmentReportService.adjustments(from, to, storeId, search, pageable)
        );
    }
}
