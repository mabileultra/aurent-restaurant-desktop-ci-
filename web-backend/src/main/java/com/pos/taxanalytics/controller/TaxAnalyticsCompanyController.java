package com.pos.taxanalytics.controller;

import com.pos.config.openapi.StandardApiResponses;
import com.pos.taxanalytics.dto.TaxAnalyticsCompaniesResponse;
import com.pos.taxanalytics.dto.TaxAnalyticsCompanyDetailResponse;
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

@RestController
@RequestMapping("/tax-analytics/companies")
@RequiredArgsConstructor
@Tag(name = "Tax analytics companies")
@StandardApiResponses
public class TaxAnalyticsCompanyController {

    private final TaxAnalyticsCompanyService taxAnalyticsCompanyService;

    @GetMapping
    @PreAuthorize("hasAnyRole('SUPER_ADMIN','PLATFORM_ADMIN','PLATFORM_ANALYTICS')")
    @Operation(summary = "Firm list with calendar-week turnover delta")
    public ResponseEntity<TaxAnalyticsCompaniesResponse> list(
        @RequestParam(required = false, defaultValue = "30d") String period,
        @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
        @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to,
        @RequestParam(required = false) String regionCode,
        @RequestParam(required = false) String districtCode,
        @RequestParam(required = false) String connectionStatus,
        @RequestParam(required = false) String search,
        @RequestParam(required = false, defaultValue = "0") int page,
        @RequestParam(required = false, defaultValue = "20") int size
    ) {
        return ResponseEntity.ok(taxAnalyticsCompanyService.list(
            period, from, to, regionCode, districtCode, connectionStatus, search, page, size
        ));
    }

    @GetMapping("/{companyId}")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN','PLATFORM_ADMIN','PLATFORM_ANALYTICS')")
    @Operation(summary = "Firm turnover for the period and the last 8 weeks")
    public ResponseEntity<TaxAnalyticsCompanyDetailResponse> detail(
        @PathVariable int companyId,
        @RequestParam(required = false, defaultValue = "30d") String period,
        @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
        @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to
    ) {
        return ResponseEntity.ok(taxAnalyticsCompanyService.detail(companyId, period, from, to));
    }
}
