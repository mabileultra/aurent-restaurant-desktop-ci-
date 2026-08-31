package com.pos.integrations.finance.controller;

import com.pos.dto.shared.PageResponse;
import com.pos.integrations.finance.dto.FinanceSyncBackfillResponse;
import com.pos.integrations.finance.dto.FinanceSyncOutboxDto;
import com.pos.integrations.finance.service.FinanceSyncAdminService;
import com.pos.integrations.finance.service.FinanceSyncBackfillService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDate;
import java.util.Arrays;
import java.util.Map;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;

/**
 * Публичный admin API синхронизации finance.
 * Логика в web-backend — без зависимости от platform-service proxy.
 */
@RestController
@RequestMapping("/admin/finance-sync")
@RequiredArgsConstructor
@PreAuthorize("hasAnyRole('ADMIN', 'SUPER_ADMIN')")
@Tag(name = "Finance Sync", description = "Синхронизация POS → finance-service")
public class AdminFinanceSyncController {

    private final FinanceSyncBackfillService backfillService;
    private final FinanceSyncAdminService adminService;

    @PostMapping("/backfill")
    @Operation(summary = "Догрузить продажи и закупы в finance за период")
    public ResponseEntity<FinanceSyncBackfillResponse> backfill(
        @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
        @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to,
        @RequestParam(defaultValue = "z-reports,purchases") String types
    ) {
        Set<String> typeSet = Arrays.stream(types.split(","))
            .map(String::trim)
            .map(String::toLowerCase)
            .filter(s -> !s.isBlank())
            .collect(Collectors.toSet());
        return ResponseEntity.ok(backfillService.backfill(from, to, typeSet));
    }

    @GetMapping("/outbox")
    @Operation(summary = "Очередь синхронизации с finance-service")
    public ResponseEntity<PageResponse<FinanceSyncOutboxDto>> outbox(
        @RequestParam(required = false) String status,
        @PageableDefault(size = 20) Pageable pageable
    ) {
        return ResponseEntity.ok(adminService.listOutbox(status, pageable));
    }

    @PostMapping("/outbox/{id}/retry")
    @Operation(summary = "Повторить отправку одной записи outbox")
    public ResponseEntity<Void> retryOutbox(@PathVariable UUID id) {
        adminService.retryOutbox(id);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/retry-pending")
    @Operation(summary = "Обработать пакет ожидающих записей outbox")
    public ResponseEntity<Map<String, Integer>> retryPending() {
        return ResponseEntity.ok(Map.of("processed", adminService.retryPendingBatch()));
    }
}
