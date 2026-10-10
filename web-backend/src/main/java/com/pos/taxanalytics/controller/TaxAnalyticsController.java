package com.pos.taxanalytics.controller;

import com.pos.taxanalytics.dto.TaxAnalyticsOverviewResponse;
import com.pos.taxanalytics.dto.TaxAnalyticsResultsResponse;
import com.pos.taxanalytics.service.TaxAnalyticsService;
import io.swagger.v3.oas.annotations.Operation;
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
@RequestMapping("/tax-analytics")
@RequiredArgsConstructor
@Tag(name = "Tax analytics")
public class TaxAnalyticsController {

    private final TaxAnalyticsService taxAnalyticsService;

    @GetMapping("/overview")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN','PLATFORM_ADMIN','PLATFORM_ANALYTICS')")
    @Operation(summary = "KPI + region cards for tax analytics")
    public ResponseEntity<TaxAnalyticsOverviewResponse> overview(
        @RequestParam(required = false, defaultValue = "30d") String period,
        @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
        @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to
    ) {
        return ResponseEntity.ok(taxAnalyticsService.overview(period, from, to));
    }

    @GetMapping("/results")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN','PLATFORM_ADMIN','PLATFORM_ANALYTICS')")
    @Operation(summary = "Tax analytics table (regions / districts / enterprises)")
    public ResponseEntity<TaxAnalyticsResultsResponse> results(
        @RequestParam(required = false, defaultValue = "30d") String period,
        @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
        @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to,
        @RequestParam(required = false) String regionCode,
        @RequestParam(required = false) String districtCode,
        @RequestParam(required = false) String connectionStatus,
        @RequestParam(required = false) String search,
        @RequestParam(required = false) String level,
        @RequestParam(required = false, defaultValue = "0") int page,
        @RequestParam(required = false, defaultValue = "20") int size
    ) {
        return ResponseEntity.ok(taxAnalyticsService.results(
            period, from, to, regionCode, districtCode, connectionStatus, search, level, page, size
        ));
    }
}
