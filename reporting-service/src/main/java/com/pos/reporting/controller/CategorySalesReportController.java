package com.pos.reporting.controller;

import com.pos.reporting.dto.CategorySalesRowResponse;
import com.pos.reporting.dto.PageResponse;
import com.pos.reporting.service.CategorySalesReportService;
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
@RequestMapping("/reports/sales")
@RequiredArgsConstructor
@Order(0)
@PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
@Tag(name = "Reporting Category Sales", description = "Продажи по категориям из reporting_db")
public class CategorySalesReportController {

    private final CategorySalesReportService categorySalesReportService;

    @GetMapping("/by-categories")
    @Operation(summary = "Продажи по категориям (reporting_db)")
    public ResponseEntity<PageResponse<CategorySalesRowResponse>> byCategories(
        @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
        @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to,
        @RequestParam(required = false) Integer storeId,
        @PageableDefault(size = 20) Pageable pageable
    ) {
        return ResponseEntity.ok(categorySalesReportService.byCategories(from, to, storeId, pageable));
    }
}
