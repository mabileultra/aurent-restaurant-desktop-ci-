package com.pos.reporting.controller;

import com.pos.reporting.dto.PageResponse;
import com.pos.reporting.dto.StockReceiptRowResponse;
import com.pos.reporting.service.StockReceiptReportService;
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
@Tag(name = "Reporting Stock Receipts", description = "Журнал приходов из reporting_db")
public class StockReceiptReportController {

    private final StockReceiptReportService stockReceiptReportService;

    @GetMapping("/receipts")
    @Operation(summary = "Журнал приходов (reporting_db)")
    public ResponseEntity<PageResponse<StockReceiptRowResponse>> receipts(
        @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
        @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to,
        @RequestParam(required = false) Integer storeId,
        @PageableDefault(size = 20) Pageable pageable
    ) {
        return ResponseEntity.ok(stockReceiptReportService.receipts(from, to, storeId, pageable));
    }
}
