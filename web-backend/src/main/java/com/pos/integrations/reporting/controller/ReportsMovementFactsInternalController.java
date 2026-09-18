package com.pos.integrations.reporting.controller;

import com.pos.dto.shared.PageResponse;
import com.pos.inventory.service.report.MovementFactsBackfillService;
import com.pos.shared.event.StockMovementRecordedEvent;
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
@RequestMapping("/internal/reports/ops/movement-facts")
@RequiredArgsConstructor
@PreAuthorize("hasRole('INTERNAL')")
@Hidden
public class ReportsMovementFactsInternalController {

    private final MovementFactsBackfillService movementFactsBackfillService;

    @GetMapping
    public ResponseEntity<PageResponse<StockMovementRecordedEvent>> page(
        @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
        @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to,
        @RequestParam(defaultValue = "0") int page,
        @RequestParam(defaultValue = "200") int size
    ) {
        return ResponseEntity.ok(movementFactsBackfillService.page(from, to, page, size));
    }
}
