package com.pos.taxanalytics.controller;

import com.pos.taxanalytics.dto.TaxAnalyticsCompareResponse;
import com.pos.taxanalytics.dto.TaxAnalyticsDailyResponse;
import com.pos.taxanalytics.dto.TaxAnalyticsExportItemResponse;
import com.pos.taxanalytics.dto.TaxAnalyticsProductsResponse;
import com.pos.taxanalytics.dto.TaxAnalyticsReceiptCountsResponse;
import com.pos.taxanalytics.dto.TaxAnalyticsReceiptListResponse;
import com.pos.taxanalytics.service.TaxAnalyticsReportService;
import com.pos.taxanalytics.service.impl.TaxAnalyticsExportServiceImpl;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/tax-analytics")
@RequiredArgsConstructor
@Tag(name = "Tax analytics reports")
public class TaxAnalyticsReportController {

    private static final String ANALYTICS = "hasAnyRole('SUPER_ADMIN','PLATFORM_ADMIN','PLATFORM_ANALYTICS')";

    private final TaxAnalyticsReportService taxAnalyticsReportService;
    private final TaxAnalyticsExportServiceImpl taxAnalyticsExportService;

    @GetMapping("/overview/daily")
    @PreAuthorize(ANALYTICS)
    @Operation(summary = "Daily turnover by region/district/businessType. Asia/Tashkent day boundaries.")
    public ResponseEntity<TaxAnalyticsDailyResponse> daily(
        @RequestParam(required = false, defaultValue = "30d") String period,
        @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
        @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to,
        @RequestParam(required = false) String regionCode,
        @RequestParam(required = false) String districtCode,
        @RequestParam(required = false) String businessType
    ) {
        return ResponseEntity.ok(taxAnalyticsReportService.daily(
            period, from, to, regionCode, districtCode, businessType
        ));
    }

    @GetMapping("/products")
    @PreAuthorize(ANALYTICS)
    @Operation(summary = "Top and bottom sold products for region/district/businessType")
    public ResponseEntity<TaxAnalyticsProductsResponse> products(
        @RequestParam(required = false, defaultValue = "30d") String period,
        @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
        @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to,
        @RequestParam(required = false) String regionCode,
        @RequestParam(required = false) String districtCode,
        @RequestParam(required = false) String businessType,
        @RequestParam(required = false, defaultValue = "10") int limit
    ) {
        return ResponseEntity.ok(taxAnalyticsReportService.products(
            period, from, to, regionCode, districtCode, businessType, limit
        ));
    }

    @GetMapping("/receipt-counts")
    @PreAuthorize(ANALYTICS)
    @Operation(summary = "Fiscal and non-fiscal receipt counts for the period and geo/type filters")
    public ResponseEntity<TaxAnalyticsReceiptCountsResponse> receiptCounts(
        @RequestParam(required = false, defaultValue = "30d") String period,
        @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
        @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to,
        @RequestParam(required = false) String regionCode,
        @RequestParam(required = false) String districtCode,
        @RequestParam(required = false) String businessType
    ) {
        return ResponseEntity.ok(taxAnalyticsReportService.receiptCounts(
            period, from, to, regionCode, districtCode, businessType
        ));
    }

    @GetMapping("/receipts")
    @PreAuthorize(ANALYTICS)
    @Operation(summary = "Receipts across companies for the period")
    public ResponseEntity<TaxAnalyticsReceiptListResponse> receipts(
        @RequestParam(required = false, defaultValue = "30d") String period,
        @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
        @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to,
        @RequestParam(required = false) String regionCode,
        @RequestParam(required = false) String connectionStatus,
        @RequestParam(required = false) String search,
        @RequestParam(required = false, defaultValue = "0") int page,
        @RequestParam(required = false, defaultValue = "20") int size
    ) {
        return ResponseEntity.ok(taxAnalyticsReportService.receipts(
            period, from, to, regionCode, connectionStatus, search, page, size
        ));
    }

    @GetMapping("/compare")
    @PreAuthorize(ANALYTICS)
    @Operation(summary = "Compare two tax-analytics periods")
    public ResponseEntity<TaxAnalyticsCompareResponse> compare(
        @RequestParam(required = false, defaultValue = "30d") String period,
        @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
        @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to,
        @RequestParam(required = false, defaultValue = "previous") String comparePeriod,
        @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate compareFrom,
        @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate compareTo
    ) {
        return ResponseEntity.ok(taxAnalyticsReportService.compare(
            period, from, to, comparePeriod, compareFrom, compareTo
        ));
    }

    @GetMapping(value = "/export", produces = "text/csv")
    @PreAuthorize(ANALYTICS)
    @Operation(summary = "CSV of region rows, including companies with no region")
    public ResponseEntity<String> export(
        @RequestParam(required = false, defaultValue = "30d") String period,
        @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
        @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to
    ) {
        return ResponseEntity.ok()
            .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=tax-analytics.csv")
            .contentType(MediaType.parseMediaType("text/csv"))
            .body(taxAnalyticsExportService.exportAndRemember(period, from, to));
    }

    @GetMapping("/exports")
    @PreAuthorize(ANALYTICS)
    @Operation(summary = "History of server-side tax analytics exports")
    public ResponseEntity<List<TaxAnalyticsExportItemResponse>> exports() {
        return ResponseEntity.ok(taxAnalyticsExportService.history());
    }

    @GetMapping(value = "/exports/{id}", produces = "text/csv")
    @PreAuthorize(ANALYTICS)
    @Operation(summary = "Download a previously created tax analytics export")
    public ResponseEntity<String> exportFile(@PathVariable UUID id) {
        return ResponseEntity.ok()
            .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=tax-analytics.csv")
            .contentType(MediaType.parseMediaType("text/csv"))
            .body(taxAnalyticsExportService.csv(id));
    }
}
