package com.pos.reporting.controller;

import com.pos.reporting.dto.PageResponse;
import com.pos.reporting.dto.stock.pos.PosDeadStockRow;
import com.pos.reporting.service.DeadStockReportService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.core.annotation.Order;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDate;

@RestController
@RequestMapping("/reports/stock")
@RequiredArgsConstructor
@Order(0)
@PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
@Tag(name = "Reporting Dead Stock", description = "Неликвид из reporting_db")
public class DeadStockReportController {

    private final DeadStockReportService deadStockReportService;

    @GetMapping("/dead-stock")
    @Operation(summary = "Неликвид (reporting_db)")
    public ResponseEntity<PageResponse<PosDeadStockRow>> deadStock(
        @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate asOfDate,
        @RequestParam(defaultValue = "30") int daysNoSale,
        @RequestParam(required = false) Integer categoryId,
        @RequestParam(required = false) String search,
        @PageableDefault(size = 20) Pageable pageable
    ) {
        return ResponseEntity.ok(
            deadStockReportService.deadStock(asOfDate, daysNoSale, categoryId, search, pageable)
        );
    }
}
