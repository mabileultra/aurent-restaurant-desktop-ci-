package com.pos.reporting.controller;

import com.pos.reporting.dto.platform.PlatformAnalyticsFiscalResponse;
import com.pos.reporting.dto.platform.PlatformAnalyticsOverviewResponse;
import com.pos.reporting.dto.platform.PlatformAnalyticsPaymentsResponse;
import com.pos.reporting.dto.platform.PlatformAnalyticsProductsResponse;
import com.pos.reporting.dto.platform.PlatformAnalyticsSalesResponse;
import com.pos.reporting.dto.platform.PlatformAnalyticsStoresResponse;
import com.pos.reporting.export.SpreadsheetDownloadSupport;
import com.pos.reporting.service.PlatformAnalyticsExportService;
import com.pos.reporting.service.PlatformAnalyticsFiscalService;
import com.pos.reporting.service.PlatformAnalyticsOverviewService;
import com.pos.reporting.service.PlatformAnalyticsPaymentsService;
import com.pos.reporting.service.PlatformAnalyticsProductsService;
import com.pos.reporting.service.PlatformAnalyticsSalesService;
import com.pos.reporting.service.PlatformAnalyticsStoresService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDate;

@RestController
@RequestMapping("/reports/platform/analytics")
@RequiredArgsConstructor
@PreAuthorize("hasAnyRole('SUPER_ADMIN', 'PLATFORM_ADMIN', 'PLATFORM_ANALYTICS')")
@Tag(name = "Platform Analytics", description = "Кросс-компанийная аналитика супер-админа")
public class PlatformAnalyticsController {

    private final PlatformAnalyticsOverviewService overviewService;
    private final PlatformAnalyticsStoresService storesService;
    private final PlatformAnalyticsProductsService productsService;
    private final PlatformAnalyticsSalesService salesService;
    private final PlatformAnalyticsPaymentsService paymentsService;
    private final PlatformAnalyticsFiscalService fiscalService;
    private final PlatformAnalyticsExportService exportService;

    @GetMapping("/overview")
    @Operation(summary = "Обзор платформы")
    public ResponseEntity<PlatformAnalyticsOverviewResponse> overview(
        @RequestParam(defaultValue = "7d") String period,
        @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
        @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to
    ) {
        return ResponseEntity.ok(overviewService.overview(period, from, to));
    }

    @GetMapping("/stores")
    @Operation(summary = "Аналитика магазинов")
    public ResponseEntity<PlatformAnalyticsStoresResponse> stores(
        @RequestParam(defaultValue = "7d") String period,
        @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
        @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to
    ) {
        return ResponseEntity.ok(storesService.stores(period, from, to));
    }

    @GetMapping("/products")
    @Operation(summary = "Аналитика товаров")
    public ResponseEntity<PlatformAnalyticsProductsResponse> products(
        @RequestParam(defaultValue = "7d") String period,
        @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
        @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to
    ) {
        return ResponseEntity.ok(productsService.products(period, from, to));
    }

    @GetMapping("/sales")
    @Operation(summary = "Аналитика продаж")
    public ResponseEntity<PlatformAnalyticsSalesResponse> sales(
        @RequestParam(defaultValue = "7d") String period,
        @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
        @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to
    ) {
        return ResponseEntity.ok(salesService.sales(period, from, to));
    }

    @GetMapping("/payments")
    @Operation(summary = "Способы оплаты")
    public ResponseEntity<PlatformAnalyticsPaymentsResponse> payments(
        @RequestParam(defaultValue = "7d") String period,
        @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
        @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to
    ) {
        return ResponseEntity.ok(paymentsService.payments(period, from, to));
    }

    @GetMapping("/fiscal")
    @Operation(summary = "Фискальная аналитика (по sale_facts, без отдельного ОФД-слоя)")
    public ResponseEntity<PlatformAnalyticsFiscalResponse> fiscal(
        @RequestParam(defaultValue = "7d") String period,
        @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
        @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to
    ) {
        return ResponseEntity.ok(fiscalService.fiscal(period, from, to));
    }

    @GetMapping("/export")
    @Operation(summary = "Excel-выгрузка вкладки аналитики")
    @ApiResponse(responseCode = "200", description = "Файл Excel")
    public ResponseEntity<byte[]> export(
        @RequestParam(defaultValue = "overview") String view,
        @RequestParam(defaultValue = "7d") String period,
        @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
        @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to
    ) {
        String safeView = view == null || view.isBlank() ? "overview" : view.trim().toLowerCase();
        return SpreadsheetDownloadSupport.attachment(
            exportService.export(safeView, period, from, to),
            "platform_analytics_" + safeView + "_export.xlsx"
        );
    }
}
