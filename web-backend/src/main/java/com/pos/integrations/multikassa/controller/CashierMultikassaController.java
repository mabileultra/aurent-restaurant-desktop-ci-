package com.pos.integrations.multikassa.controller;

import com.pos.config.openapi.StandardApiResponses;
import com.pos.integrations.multikassa.dto.CashierMultikassaCapabilitiesResponse;
import com.pos.integrations.multikassa.dto.UpdateCashierMultikassaFlagsRequest;
import com.pos.integrations.multikassa.service.MultikassaSettingsService;
import com.pos.service.support.TenantAccessSupport;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/cashier/multikassa")
@RequiredArgsConstructor
@PreAuthorize("hasAnyRole('ADMIN', 'MANAGER', 'CASHIER')")
@Tag(name = "Cashier Multikassa", description = "Возможности Multikassa на кассе")
@StandardApiResponses
public class CashierMultikassaController {

    private final MultikassaSettingsService settingsService;
    private final TenantAccessSupport tenantAccess;

    @GetMapping
    @Operation(summary = "Настройки Multikassa для текущей кассы")
    public ResponseEntity<CashierMultikassaCapabilitiesResponse> capabilities(
        @RequestParam Integer storeId,
        @RequestParam(required = false) Long cashRegisterId
    ) {
        return ResponseEntity.ok(
            settingsService.getCashierCapabilities(tenantAccess.currentUser(), storeId, cashRegisterId)
        );
    }

    @PatchMapping("/flags")
    @Operation(summary = "Вкл/выкл печать фискального QR (и опционально requireBeforeSale)")
    public ResponseEntity<CashierMultikassaCapabilitiesResponse> updateFlags(
        @RequestParam Integer storeId,
        @RequestParam(required = false) Long cashRegisterId,
        @Valid @RequestBody UpdateCashierMultikassaFlagsRequest request
    ) {
        return ResponseEntity.ok(
            settingsService.updateCashierFlags(
                tenantAccess.currentUser(),
                storeId,
                cashRegisterId,
                request
            )
        );
    }
}
