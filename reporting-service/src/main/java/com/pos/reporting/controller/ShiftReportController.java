package com.pos.reporting.controller;

import com.pos.reporting.dto.shift.ShiftOverviewResponse;
import com.pos.reporting.service.ShiftReportService;
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
@RequestMapping("/reports/shifts")
@RequiredArgsConstructor
@Order(0)
@PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
@Tag(name = "Reporting Shifts", description = "Z-отчёты и закрытые смены из reporting_db")
public class ShiftReportController {

    private final ShiftReportService shiftReportService;

    @GetMapping("/overview")
    @Operation(summary = "Сводка Z-отчётов за период и последние закрытия")
    public ResponseEntity<ShiftOverviewResponse> overview(
        @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
        @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to,
        @RequestParam(defaultValue = "15") int recentLimit
    ) {
        return ResponseEntity.ok(shiftReportService.overview(from, to, recentLimit));
    }
}
