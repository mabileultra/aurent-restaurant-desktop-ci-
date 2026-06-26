package com.pos.reporting.controller;

import com.pos.reporting.dto.ReportingBackfillResponse;
import com.pos.reporting.service.ReportingBackfillService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDate;

@RestController
@RequestMapping("/admin/reporting-sync")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
@Tag(name = "Reporting Sync", description = "Догрузка read-model из pos_db")
public class ReportingSyncController {

    private final ReportingBackfillService reportingBackfillService;

    @PostMapping("/backfill")
    @Operation(summary = "Догрузить reporting read-model за период из pos_db")
    public ResponseEntity<ReportingBackfillResponse> backfill(
        HttpServletRequest request,
        @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
        @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to,
        @RequestParam(defaultValue = "sales,stock,movements,shifts,products,inventories,transfers") String types
    ) {
        return ResponseEntity.ok(
            reportingBackfillService.backfill(from, to, types, request.getHeader("Authorization"))
        );
    }
}
