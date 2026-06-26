package com.pos.reporting.controller;

import com.pos.reporting.dto.PageResponse;
import com.pos.reporting.dto.stock.pos.PosLowStockRow;
import com.pos.reporting.service.LowStockReportService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.core.annotation.Order;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/reports/stock")
@RequiredArgsConstructor
@Order(0)
@PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
@Tag(name = "Reporting Low Stock", description = "Низкие остатки из reporting_db")
public class LowStockReportController {

    private final LowStockReportService lowStockReportService;

    @GetMapping("/low-stock")
    @Operation(summary = "Низкие остатки (reporting_db)")
    public ResponseEntity<PageResponse<PosLowStockRow>> lowStock(
        @PageableDefault(size = 20) Pageable pageable
    ) {
        return ResponseEntity.ok(lowStockReportService.lowStock(pageable));
    }
}
