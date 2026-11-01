package com.pos.restaurant.analytics.controller;

import com.pos.restaurant.analytics.dto.ActivityEventResponse;
import com.pos.restaurant.analytics.dto.DashboardResponse;
import com.pos.restaurant.analytics.dto.SalesReportResponse;
import com.pos.restaurant.analytics.service.RestaurantAnalyticsService;
import com.pos.shared.api.PageResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.time.Instant;
import java.util.UUID;

@RestController
@RequestMapping("/rst")
@RequiredArgsConstructor
@Tag(name = "Restaurant analytics", description = "Дашборд, отчёты и журнал активности")
public class RestaurantAnalyticsController {

    private final RestaurantAnalyticsService analyticsService;

    @GetMapping("/stores/{storeId}/dashboard")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
    @Operation(summary = "Операционный дашборд: KPI периода + live зал/кухня")
    public DashboardResponse dashboard(
        @PathVariable Integer storeId,
        @RequestParam(required = false, defaultValue = "TODAY") String period,
        @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) Instant from,
        @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) Instant to,
        @RequestParam(required = false) Integer hallId,
        @RequestParam(required = false) UUID waiterUserId
    ) {
        return analyticsService.dashboard(storeId, period, from, to, hallId, waiterUserId);
    }

    @GetMapping("/stores/{storeId}/reports/sales")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
    @Operation(summary = "Отчёт продаж: блюда и часы")
    public SalesReportResponse salesReport(
        @PathVariable Integer storeId,
        @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) Instant from,
        @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) Instant to
    ) {
        return analyticsService.salesReport(storeId, from, to);
    }

    @GetMapping("/stores/{storeId}/activity")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
    @Operation(summary = "Журнал активности (page/size)")
    public PageResponse<ActivityEventResponse> activity(
        @PathVariable Integer storeId,
        @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) Instant from,
        @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) Instant to,
        @RequestParam(defaultValue = "0") int page,
        @RequestParam(defaultValue = "20") int size,
        @RequestParam(required = false) String type,
        @RequestParam(required = false) String search
    ) {
        return analyticsService.activity(storeId, from, to, page, size, type, search);
    }
}
