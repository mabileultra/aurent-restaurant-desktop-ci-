package com.pos.restaurant.commission.controller;

import com.pos.restaurant.commission.dto.WaiterCommissionPercentRequest;
import com.pos.restaurant.commission.dto.WaiterCommissionOrdersResponse;
import com.pos.restaurant.commission.dto.WaiterCommissionReportResponse;
import com.pos.restaurant.commission.dto.WaiterCommissionSettingsResponse;
import com.pos.restaurant.commission.service.WaiterCommissionService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.time.Instant;
import java.util.UUID;

@RestController
@RequestMapping("/rst")
@RequiredArgsConstructor
@Tag(name = "Waiter commission", description = "Процент официанта за закрытый стол")
public class WaiterCommissionController {

    private final WaiterCommissionService commissionService;

    @GetMapping("/stores/{storeId}/waiter-commission")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER', 'WAITER', 'CASHIER')")
    @Operation(summary = "Настройки комиссии официантов")
    public WaiterCommissionSettingsResponse getSettings(@PathVariable Integer storeId) {
        return commissionService.getSettings(storeId);
    }

    @PutMapping("/stores/{storeId}/waiter-commission/default")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
    @Operation(summary = "Процент по умолчанию для официантов")
    public WaiterCommissionSettingsResponse setDefault(
        @PathVariable Integer storeId,
        @Valid @RequestBody WaiterCommissionPercentRequest request
    ) {
        return commissionService.setDefaultPercent(storeId, request.percent());
    }

    @PutMapping("/stores/{storeId}/waiter-commission/waiters/{userId}")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
    @Operation(summary = "Персональный процент официанта")
    public WaiterCommissionSettingsResponse setWaiter(
        @PathVariable Integer storeId,
        @PathVariable UUID userId,
        @Valid @RequestBody WaiterCommissionPercentRequest request
    ) {
        return commissionService.setWaiterPercent(storeId, userId, request.percent());
    }

    @DeleteMapping("/stores/{storeId}/waiter-commission/waiters/{userId}")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
    @Operation(summary = "Сбросить персональный процент (взять default)")
    public WaiterCommissionSettingsResponse clearWaiter(
        @PathVariable Integer storeId,
        @PathVariable UUID userId
    ) {
        return commissionService.clearWaiterPercent(storeId, userId);
    }

    @PostMapping("/stores/{storeId}/waiter-commission/apply-all")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
    @Operation(summary = "Применить процент ко всем (перезаписывает персональные)")
    public WaiterCommissionSettingsResponse applyAll(
        @PathVariable Integer storeId,
        @Valid @RequestBody WaiterCommissionPercentRequest request
    ) {
        return commissionService.applyToAll(storeId, request.percent());
    }

    @GetMapping("/stores/{storeId}/reports/waiter-commission")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
    @Operation(summary = "Отчёт комиссии официантов за период")
    public WaiterCommissionReportResponse report(
        @PathVariable Integer storeId,
        @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) Instant from,
        @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) Instant to
    ) {
        return commissionService.report(storeId, from, to);
    }

    @GetMapping("/stores/{storeId}/reports/waiter-commission/waiters/{waiterUserId}")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
    @Operation(summary = "Заказы официанта в отчёте комиссии (страница)")
    public WaiterCommissionOrdersResponse waiterOrders(
        @PathVariable Integer storeId,
        @PathVariable UUID waiterUserId,
        @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) Instant from,
        @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) Instant to,
        @RequestParam(defaultValue = "0") int page,
        @RequestParam(defaultValue = "14") int size
    ) {
        return commissionService.waiterOrders(storeId, waiterUserId, from, to, page, size);
    }
}
