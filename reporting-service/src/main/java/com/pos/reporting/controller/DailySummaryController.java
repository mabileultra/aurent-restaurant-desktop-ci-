package com.pos.reporting.controller;

import com.pos.reporting.dto.DailySummaryResponse;
import com.pos.reporting.service.DailySummaryService;
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
@RequestMapping("/reports")
@RequiredArgsConstructor
@Order(0)
@PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
@Tag(name = "Reporting Daily", description = "Дневная сводка из Kafka read-model")
public class DailySummaryController {

    private final DailySummaryService dailySummaryService;

    @GetMapping("/daily")
    @Operation(summary = "Дневная сводка (reporting_db)")
    public ResponseEntity<DailySummaryResponse> dailySummary(
        @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date
    ) {
        return ResponseEntity.ok(dailySummaryService.dailySummary(date));
    }
}
