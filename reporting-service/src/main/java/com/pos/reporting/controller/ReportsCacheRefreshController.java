package com.pos.reporting.controller;

import com.pos.reporting.service.PosCacheRefreshService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.core.annotation.Order;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/reports")
@RequiredArgsConstructor
@Order(0)
@Tag(name = "Reporting Cache", description = "Обновление POS-кэшей для отчётов")
public class ReportsCacheRefreshController {

    private final PosCacheRefreshService posCacheRefreshService;

    @PostMapping("/cache/refresh")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Обновить кэш POS-отчётов")
    @ApiResponse(responseCode = "204", description = "Кэш обновлён")
    public ResponseEntity<Void> refreshCaches() {
        posCacheRefreshService.refresh();
        return ResponseEntity.noContent().build();
    }
}
