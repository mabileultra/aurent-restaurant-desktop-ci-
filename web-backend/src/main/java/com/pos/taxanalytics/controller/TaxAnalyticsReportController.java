package com.pos.taxanalytics.controller;

import com.pos.taxanalytics.dto.TaxAnalyticsCompareResponse;
import com.pos.taxanalytics.dto.TaxAnalyticsDailyResponse;
import com.pos.taxanalytics.dto.TaxAnalyticsReceiptListResponse;
import com.pos.taxanalytics.service.TaxAnalyticsReportService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDate;

@RestController
@RequestMapping("/tax-analytics")
@RequiredArgsConstructor
@Tag(name = "Tax analytics reports")
public class TaxAnalyticsReportController {

    private static final String ANALYTICS = "hasAnyRole('SUPER_ADMIN','PLATFORM_ADMIN','PLATFORM_ANALYTICS')";

    private final TaxAnalyticsReportService taxAnalyticsReportService;

    @GetMapping("/overview/daily")
    @PreAuthorize(ANALYTICS)
    @Operation(summary = "Daily fiscal and non-fiscal turnover")
    public ResponseEntity<TaxAnalyticsDailyResponse> daily(
        @RequestParam(required = false, defaultValue = "30d") String period,
        @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
        @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to
    ) {
        return ResponseEntity.ok(taxAnalyticsReportService.daily(period, from, to));
    }

    @GetMapping("/receipts")
    @PreAuthorize(ANALYTICS)
    @Operation(summary = "Receipts across companies for the period")
    public ResponseEntity<TaxAnalyticsReceiptListResponse> receipts(
        @RequestParam(required = false, defaultValue = "30d") String period,
        @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
        @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to,
        @RequestParam(required = false, defaultValue = "0") int page,
        @RequestParam(required = false, defaultValue = "20") int size
    ) {
        return ResponseEntity.ok(taxAnalyticsReportService.receipts(period, from, to, page, size));
    }

    @GetMapping("/compare")
    @PreAuthorize(ANALYTICS)
    @Operation(summary = "Compare two tax-analytics periods")
    public ResponseEntity<TaxAnalyticsCompareResponse> compare(
        @RequestParam(required = false, defaultValue = "30d") String period,
        @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
        @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to,
        @RequestParam(required = false, defaultValue = "30d") String comparePeriod,
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
            .body(taxAnalyticsReportService.exportCsv(period, from, to));
    }
}
