package com.pos.integrations.reporting.controller;

import com.pos.dto.shared.PageResponse;
import com.pos.sales.service.report.ShiftFactsBackfillService;
import com.pos.shared.event.ShiftClosedEvent;
import io.swagger.v3.oas.annotations.Hidden;
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
@RequestMapping("/internal/reports/ops/shift-facts")
@RequiredArgsConstructor
@PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
@Hidden
public class ReportsShiftFactsInternalController {

    private final ShiftFactsBackfillService shiftFactsBackfillService;

    @GetMapping
    public ResponseEntity<PageResponse<ShiftClosedEvent>> page(
        @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
        @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to,
        @RequestParam(defaultValue = "0") int page,
        @RequestParam(defaultValue = "200") int size
    ) {
        return ResponseEntity.ok(shiftFactsBackfillService.page(from, to, page, size));
    }
}
