package com.pos.reporting.controller;

import com.pos.reporting.export.SpreadsheetDownloadSupport;
import com.pos.reporting.service.SalesReportExportService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
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
@RequestMapping("/reports")
@RequiredArgsConstructor
@Order(0)
@Tag(name = "Reporting Sales Export", description = "Excel-выгрузки продаж из reporting_db")
public class SalesReportExportController {

    private final SalesReportExportService salesReportExportService;

    @GetMapping(value = "/sales/by-products/export")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
    @Operation(summary = "Экспорт продаж по товарам")
    @ApiResponse(responseCode = "200", description = "Файл Excel")
    public ResponseEntity<byte[]> exportByProducts(
        @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
        @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to,
        @RequestParam(required = false) Integer storeId,
        @RequestParam(required = false) Integer categoryId,
        @RequestParam(required = false) String search
    ) {
        return SpreadsheetDownloadSupport.attachment(
            salesReportExportService.exportByProducts(from, to, storeId, categoryId, search),
            "sales_by_products_export.xlsx"
        );
    }

    @GetMapping(value = "/sales/by-categories/export")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
    @Operation(summary = "Экспорт продаж по категориям")
    @ApiResponse(responseCode = "200", description = "Файл Excel")
    public ResponseEntity<byte[]> exportByCategories(
        @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
        @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to,
        @RequestParam(required = false) Integer storeId
    ) {
        return SpreadsheetDownloadSupport.attachment(
            salesReportExportService.exportByCategories(from, to, storeId),
            "sales_by_categories_export.xlsx"
        );
    }

    @GetMapping(value = "/sales/by-stores/export")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
    @Operation(summary = "Экспорт продаж по магазинам")
    @ApiResponse(responseCode = "200", description = "Файл Excel")
    public ResponseEntity<byte[]> exportByStores(
        @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
        @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to
    ) {
        return SpreadsheetDownloadSupport.attachment(
            salesReportExportService.exportByStores(from, to),
            "sales_by_stores_export.xlsx"
        );
    }

    @GetMapping(value = "/sales/period-compare/export")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
    @Operation(summary = "Экспорт сравнения периодов")
    @ApiResponse(responseCode = "200", description = "Файл Excel")
    public ResponseEntity<byte[]> exportPeriodCompare(
        @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
        @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to,
        @RequestParam(required = false) Integer storeId
    ) {
        return SpreadsheetDownloadSupport.attachment(
            salesReportExportService.exportPeriodCompare(from, to, storeId),
            "period_compare_export.xlsx"
        );
    }

    @GetMapping(value = "/daily/export")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
    @Operation(summary = "Экспорт дневной сводки")
    @ApiResponse(responseCode = "200", description = "Файл Excel")
    public ResponseEntity<byte[]> exportDaily(
        @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date
    ) {
        return SpreadsheetDownloadSupport.attachment(
            salesReportExportService.exportDailySummary(date),
            "daily_summary_export.xlsx"
        );
    }

    @GetMapping(value = "/cashier-performance/export")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Экспорт эффективности кассиров")
    @ApiResponse(responseCode = "200", description = "Файл Excel")
    public ResponseEntity<byte[]> exportCashierPerformance(
        @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
        @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to
    ) {
        return SpreadsheetDownloadSupport.attachment(
            salesReportExportService.exportCashierPerformance(from, to),
            "cashier_performance_export.xlsx"
        );
    }
}
