package com.pos.reporting.controller;

import com.pos.reporting.dto.SalesReportResponse;
import com.pos.reporting.dto.SalesSummaryResponse;
import com.pos.reporting.service.SalesReportService;
import com.pos.reporting.service.SalesSummaryService;
import io.swagger.v3.oas.annotations.Operation;
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
@RequestMapping("/reports/sales")
@RequiredArgsConstructor
@Order(0)
@PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
@Tag(name = "Reporting Sales", description = "Сводки продаж из Kafka read-model")
public class SalesSummaryController {

    private final SalesSummaryService salesSummaryService;
    private final SalesReportService salesReportService;

    @GetMapping
    @Operation(summary = "Отчёт по продажам (reporting_db)", description = "Агрегированный отчёт продаж за период из Kafka read-model")
    public ResponseEntity<SalesReportResponse> salesReport(
        @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
        @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to
    ) {
        return ResponseEntity.ok(salesReportService.salesReport(from, to));
    }

    @GetMapping("/summary")
    @Operation(summary = "Сводка продаж за период (reporting_db)")
    public ResponseEntity<SalesSummaryResponse> summary(
        @RequestParam Integer companyId,
        @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
        @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to
    ) {
        return ResponseEntity.ok(salesSummaryService.summary(companyId, from, to));
    }
}
