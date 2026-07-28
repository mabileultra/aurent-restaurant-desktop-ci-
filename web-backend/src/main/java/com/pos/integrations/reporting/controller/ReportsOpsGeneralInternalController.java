package com.pos.integrations.reporting.controller;

import com.pos.service.cache.PosCacheRefreshOrchestrator;
import io.swagger.v3.oas.annotations.Hidden;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/internal/reports/ops")
@RequiredArgsConstructor
@PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
@Hidden
public class ReportsOpsGeneralInternalController {

    private final PosCacheRefreshOrchestrator posCacheRefreshOrchestrator;

    @PostMapping("/cache/refresh")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Обновить кэш", description = "Принудительное обновление кэшей POS-данных")
    @ApiResponse(responseCode = "204", description = "Кэш обновлён")
    public ResponseEntity<Void> refreshCaches() {
        posCacheRefreshOrchestrator.refreshAll();
        return ResponseEntity.noContent().build();
    }
}
