package com.pos.integrations.fiscal.controller;

import com.pos.config.openapi.StandardApiResponses;
import com.pos.integrations.fiscal.dto.CashierFiscalCapabilitiesResponse;
import com.pos.integrations.fiscal.service.CashierFiscalCapabilitiesService;
import com.pos.service.support.TenantAccessSupport;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/cashier/fiscal")
@RequiredArgsConstructor
@PreAuthorize("hasAnyRole('ADMIN', 'MANAGER', 'CASHIER')")
@Tag(name = "Cashier Fiscal", description = "Провайдер фискализации кассы (Multikassa или FiscalDrive)")
@StandardApiResponses
public class CashierFiscalController {

    private final CashierFiscalCapabilitiesService capabilitiesService;
    private final TenantAccessSupport tenantAccess;

    @GetMapping
    @Operation(summary = "Какой фискальный провайдер у кассы и его настройки")
    public ResponseEntity<CashierFiscalCapabilitiesResponse> capabilities(
        @RequestParam Integer storeId,
        @RequestParam(required = false) Long cashRegisterId
    ) {
        return ResponseEntity.ok(
            capabilitiesService.getCapabilities(tenantAccess.currentUser(), storeId, cashRegisterId)
        );
    }
}
