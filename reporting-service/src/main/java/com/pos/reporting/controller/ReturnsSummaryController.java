package com.pos.reporting.controller;

import com.pos.reporting.dto.ReturnsSummaryResponse;
import com.pos.reporting.service.ReturnsSummaryService;
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
@Tag(name = "Reporting Returns", description = "Сводка возвратов из reporting_db")
public class ReturnsSummaryController {

    private final ReturnsSummaryService returnsSummaryService;

    @GetMapping("/returns-summary")
    @Operation(summary = "Количество и сумма возвратов за период")
    public ResponseEntity<ReturnsSummaryResponse> returnsSummary(
        @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
        @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to
    ) {
        return ResponseEntity.ok(returnsSummaryService.summary(from, to));
    }
}
