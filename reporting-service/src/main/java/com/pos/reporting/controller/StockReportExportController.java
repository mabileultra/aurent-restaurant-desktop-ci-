package com.pos.reporting.controller;

import com.pos.reporting.export.SpreadsheetDownloadSupport;
import com.pos.reporting.service.StockReportExportService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.servlet.http.HttpServletRequest;
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
@RequestMapping("/reports/stock")
@RequiredArgsConstructor
@Order(0)
@PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
@Tag(name = "Reporting Stock Export", description = "Excel-выгрузки складских отчётов")
public class StockReportExportController {

    private final StockReportExportService stockReportExportService;

    @GetMapping(value = "/balances/export")
    @Operation(summary = "Экспорт остатков")
    @ApiResponse(responseCode = "200", description = "Файл Excel")
    public ResponseEntity<byte[]> exportBalances(
        @RequestParam(required = false) Integer categoryId,
        @RequestParam(required = false) String search,
        @RequestParam(defaultValue = "false") boolean onlyWithStock,
        HttpServletRequest request
    ) {
        return SpreadsheetDownloadSupport.attachment(
            stockReportExportService.exportBalances(categoryId, search, onlyWithStock, request.getHeader("Authorization")),
            "stock_balances_export.xlsx"
        );
    }

    @GetMapping(value = "/dead-stock/export")
    @Operation(summary = "Экспорт неликвида")
    @ApiResponse(responseCode = "200", description = "Файл Excel")
    public ResponseEntity<byte[]> exportDeadStock(
        @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate asOfDate,
        @RequestParam(defaultValue = "30") int daysNoSale,
        @RequestParam(required = false) Integer categoryId,
        @RequestParam(required = false) String search,
        HttpServletRequest request
    ) {
        return SpreadsheetDownloadSupport.attachment(
            stockReportExportService.exportDeadStock(asOfDate, daysNoSale, categoryId, search, request.getHeader("Authorization")),
            "dead_stock_export.xlsx"
        );
    }

    @GetMapping(value = "/adjustments/export")
    @Operation(summary = "Экспорт корректировок")
    @ApiResponse(responseCode = "200", description = "Файл Excel")
    public ResponseEntity<byte[]> exportAdjustments(
        @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
        @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to,
        @RequestParam(required = false) Integer storeId,
        @RequestParam(required = false) String search,
        HttpServletRequest request
    ) {
        return SpreadsheetDownloadSupport.attachment(
            stockReportExportService.exportAdjustments(from, to, storeId, search),
            "stock_adjustments_export.xlsx"
        );
    }

    @GetMapping(value = "/inventories/export")
    @Operation(summary = "Экспорт инвентаризаций")
    @ApiResponse(responseCode = "200", description = "Файл Excel")
    public ResponseEntity<byte[]> exportInventories(
        @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
        @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to,
        @RequestParam(required = false) Integer storeId,
        HttpServletRequest request
    ) {
        return SpreadsheetDownloadSupport.attachment(
            stockReportExportService.exportInventories(from, to, storeId),
            "stock_inventories_export.xlsx"
        );
    }

    @GetMapping(value = "/transfers/export")
    @Operation(summary = "Экспорт перемещений")
    @ApiResponse(responseCode = "200", description = "Файл Excel")
    public ResponseEntity<byte[]> exportTransfers(
        @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
        @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to,
        @RequestParam(required = false) Integer fromStoreId,
        @RequestParam(required = false) Integer toStoreId,
        HttpServletRequest request
    ) {
        return SpreadsheetDownloadSupport.attachment(
            stockReportExportService.exportTransfers(from, to, fromStoreId, toStoreId),
            "stock_transfers_export.xlsx"
        );
    }
}
