package com.pos.reporting.controller;

import com.pos.reporting.dto.CashierStatResponse;
import com.pos.reporting.service.CashierPerformanceService;
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
import java.util.List;

@RestController
@RequestMapping("/reports")
@RequiredArgsConstructor
@Order(0)
@PreAuthorize("hasRole('ADMIN')")
@Tag(name = "Reporting Cashiers", description = "Эффективность кассиров из reporting_db")
public class CashierPerformanceController {

    private final CashierPerformanceService cashierPerformanceService;

    @GetMapping("/cashier-performance")
    @Operation(summary = "Эффективность кассиров (reporting_db)")
    public ResponseEntity<List<CashierStatResponse>> cashierPerformance(
        @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
        @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to
    ) {
        return ResponseEntity.ok(cashierPerformanceService.performance(from, to));
    }
}
