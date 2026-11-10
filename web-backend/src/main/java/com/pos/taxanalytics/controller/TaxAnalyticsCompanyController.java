package com.pos.taxanalytics.controller;

import com.pos.config.openapi.StandardApiResponses;
import com.pos.taxanalytics.dto.TaxAnalyticsCompaniesResponse;
import com.pos.taxanalytics.dto.TaxAnalyticsCompanyDetailResponse;
import com.pos.taxanalytics.dto.TaxAnalyticsReceiptDetailResponse;
import com.pos.taxanalytics.dto.TaxAnalyticsReceiptsResponse;
import com.pos.taxanalytics.service.TaxAnalyticsCompanyReceiptService;
import com.pos.taxanalytics.service.TaxAnalyticsCompanyService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDate;
import java.util.UUID;

@RestController
@RequestMapping("/tax-analytics/companies")
@RequiredArgsConstructor
@Tag(name = "Tax analytics companies")
@StandardApiResponses
public class TaxAnalyticsCompanyController {

    private final TaxAnalyticsCompanyService taxAnalyticsCompanyService;
    private final TaxAnalyticsCompanyReceiptService taxAnalyticsCompanyReceiptService;

    @GetMapping
    @PreAuthorize("hasAnyRole('SUPER_ADMIN','PLATFORM_ADMIN','PLATFORM_ANALYTICS')")
    @Operation(summary = "Firm list with businessType/legalName/address/phone. sort=totalTurnover,desc is applied on the server.")
    public ResponseEntity<TaxAnalyticsCompaniesResponse> list(
        @RequestParam(required = false, defaultValue = "30d") String period,
        @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
        @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to,
        @RequestParam(required = false) String regionCode,
        @RequestParam(required = false) String districtCode,
        @RequestParam(required = false) String businessType,
        @RequestParam(required = false) String connectionStatus,
        @RequestParam(required = false) String search,
        @RequestParam(required = false, defaultValue = "0") int page,
        @RequestParam(required = false, defaultValue = "20") int size,
        @RequestParam(required = false, defaultValue = "totalTurnover,desc") String sort
    ) {
        return ResponseEntity.ok(taxAnalyticsCompanyService.list(
            period, from, to, regionCode, districtCode, businessType, connectionStatus, search, page, size, sort
        ));
    }

    @GetMapping("/{companyId}")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN','PLATFORM_ADMIN','PLATFORM_ANALYTICS')")
    @Operation(summary = "Firm detail: turnover, receipt counts, average check, fiscal terminal, first/last sale, daily receipt counts")
    public ResponseEntity<TaxAnalyticsCompanyDetailResponse> detail(
        @PathVariable int companyId,
        @RequestParam(required = false, defaultValue = "30d") String period,
        @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
        @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to
    ) {
        return ResponseEntity.ok(taxAnalyticsCompanyService.detail(companyId, period, from, to));
    }

    @GetMapping("/{companyId}/receipts")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN','PLATFORM_ADMIN','PLATFORM_ANALYTICS')")
    @Operation(summary = "Чеки фирмы. date, либо from/to, либо без дат (тогда последние 30 дней Asia/Tashkent).")
    public ResponseEntity<TaxAnalyticsReceiptsResponse> receipts(
        @PathVariable int companyId,
        @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date,
        @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
        @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to,
        @RequestParam(defaultValue = "ALL") String kind,
        @RequestParam(defaultValue = "0") int page,
        @RequestParam(defaultValue = "10") int size
    ) {
        return ResponseEntity.ok(taxAnalyticsCompanyReceiptService.list(companyId, date, from, to, kind, page, size));
    }

    @GetMapping("/{companyId}/receipts/{saleId}")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN','PLATFORM_ADMIN','PLATFORM_ANALYTICS')")
    @Operation(summary = "Пробитый чек фирмы")
    public ResponseEntity<TaxAnalyticsReceiptDetailResponse> receipt(
        @PathVariable int companyId,
        @PathVariable UUID saleId
    ) {
        return ResponseEntity.ok(taxAnalyticsCompanyReceiptService.detail(companyId, saleId));
    }
}
