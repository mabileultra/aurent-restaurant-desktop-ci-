package com.pos.platform.controller;

import com.pos.platform.service.PosCoreProxyService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
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
import java.util.UUID;

@RestController
@RequestMapping("/admin/finance-sync")
@RequiredArgsConstructor
@PreAuthorize("hasAnyRole('ADMIN', 'SUPER_ADMIN')")
@Tag(name = "Finance Sync", description = "Синхронизация POS → finance-service (прокси в POS core)")
public class FinanceSyncController {

    private static final String PUBLIC_PREFIX = "/admin/finance-sync";
    private static final String OPS_BASE = "finance-sync";

    private final PosCoreProxyService posCoreProxyService;

    @PostMapping("/backfill")
    @Operation(summary = "Догрузить продажи и закупы в finance за период")
    public ResponseEntity<byte[]> backfill(
        HttpServletRequest request,
        @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
        @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to,
        @RequestParam(defaultValue = "sales,purchases") String types
    ) {
        return posCoreProxyService.forward(request, PUBLIC_PREFIX, OPS_BASE);
    }

    @GetMapping("/outbox")
    @Operation(summary = "Очередь синхронизации с finance-service")
    public ResponseEntity<byte[]> outbox(
        HttpServletRequest request,
        @RequestParam(required = false) String status
    ) {
        return posCoreProxyService.forward(request, PUBLIC_PREFIX, OPS_BASE);
    }

    @PostMapping("/outbox/{id}/retry")
    @Operation(summary = "Повторить отправку одной записи outbox")
    public ResponseEntity<byte[]> retryOutbox(HttpServletRequest request, @PathVariable UUID id) {
        return posCoreProxyService.forward(request, PUBLIC_PREFIX, OPS_BASE);
    }

    @PostMapping("/retry-pending")
    @Operation(summary = "Обработать пакет ожидающих записей outbox")
    public ResponseEntity<byte[]> retryPending(HttpServletRequest request) {
        return posCoreProxyService.forward(request, PUBLIC_PREFIX, OPS_BASE);
    }
}
