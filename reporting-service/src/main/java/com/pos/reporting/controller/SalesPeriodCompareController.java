package com.pos.reporting.controller;

import com.pos.reporting.dto.PeriodCompareResponse;
import com.pos.reporting.service.PeriodCompareService;
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
@Tag(name = "Reporting Period Compare", description = "Сравнение периодов из reporting_db")
public class SalesPeriodCompareController {

    private final PeriodCompareService periodCompareService;

    @GetMapping("/period-compare")
    @Operation(summary = "Сравнение периодов (reporting_db)")
    public ResponseEntity<PeriodCompareResponse> periodCompare(
        @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
        @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to,
        @RequestParam(required = false) Integer storeId
    ) {
        return ResponseEntity.ok(periodCompareService.compare(from, to, storeId));
    }
}
