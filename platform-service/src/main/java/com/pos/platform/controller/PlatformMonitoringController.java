package com.pos.platform.controller;

import com.pos.platform.service.PosCoreProxyService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/platform/monitoring")
@RequiredArgsConstructor
@PreAuthorize("hasAnyRole('SUPER_ADMIN', 'PLATFORM_ADMIN')")
@Tag(name = "Platform Monitoring", description = "Мониторинг системы (прокси в POS core)")
public class PlatformMonitoringController {

    private static final String PUBLIC_PREFIX = "/platform/monitoring";
    private static final String OPS_BASE = "monitoring";

    private final PosCoreProxyService posCoreProxyService;

    @GetMapping("/overview")
    @Operation(summary = "Обзор системы")
    public ResponseEntity<byte[]> overview(HttpServletRequest request) {
        return posCoreProxyService.forward(request, PUBLIC_PREFIX, OPS_BASE);
    }

    @GetMapping("/metrics")
    @Operation(summary = "Список метрик")
    public ResponseEntity<byte[]> metrics(
        HttpServletRequest request,
        @RequestParam(value = "search", required = false) String search
    ) {
        return posCoreProxyService.forward(request, PUBLIC_PREFIX, OPS_BASE);
    }

    @GetMapping("/metrics/{name}")
    @Operation(summary = "Детали метрики")
    public ResponseEntity<byte[]> metricDetail(HttpServletRequest request, @PathVariable String name) {
        return posCoreProxyService.forward(request, PUBLIC_PREFIX, OPS_BASE);
    }

    @GetMapping("/logs")
    @Operation(summary = "Журнал логов")
    public ResponseEntity<byte[]> logs(
        HttpServletRequest request,
        @RequestParam(value = "limit", defaultValue = "200") int limit,
        @RequestParam(value = "level", required = false) String level
    ) {
        return posCoreProxyService.forward(request, PUBLIC_PREFIX, OPS_BASE);
    }

    @DeleteMapping("/logs")
    @Operation(summary = "Очистить логи")
    public ResponseEntity<byte[]> clearLogs(HttpServletRequest request) {
        return posCoreProxyService.forward(request, PUBLIC_PREFIX, OPS_BASE);
    }
}
