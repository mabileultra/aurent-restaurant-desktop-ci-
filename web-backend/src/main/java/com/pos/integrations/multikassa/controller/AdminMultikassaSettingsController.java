package com.pos.integrations.multikassa.controller;

import com.pos.config.openapi.StandardApiResponses;
import com.pos.integrations.multikassa.dto.AdminMultikassaSettingsResponse;
import com.pos.integrations.multikassa.dto.SaveMultikassaSettingsRequest;
import com.pos.integrations.multikassa.service.MultikassaSettingsService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/admin/cash-registers/{cashRegisterId}/multikassa")
@RequiredArgsConstructor
@PreAuthorize("hasAnyRole('ADMIN', 'SUPER_ADMIN', 'MANAGER', 'CASHIER')")
@Tag(name = "Multikassa", description = "Настройки Multikassa / ОФД для кассы")
@StandardApiResponses
public class AdminMultikassaSettingsController {

    private final MultikassaSettingsService settingsService;

    @GetMapping
    @Operation(summary = "Настройки Multikassa кассы")
    public ResponseEntity<AdminMultikassaSettingsResponse> get(@PathVariable Long cashRegisterId) {
        return ResponseEntity.ok(settingsService.getAdminSettings(cashRegisterId));
    }

    @PutMapping
    @Operation(summary = "Сохранить настройки Multikassa кассы")
    public ResponseEntity<AdminMultikassaSettingsResponse> save(
        @PathVariable Long cashRegisterId,
        @Valid @RequestBody SaveMultikassaSettingsRequest request
    ) {
        return ResponseEntity.ok(settingsService.saveAdminSettings(cashRegisterId, request));
    }
}
