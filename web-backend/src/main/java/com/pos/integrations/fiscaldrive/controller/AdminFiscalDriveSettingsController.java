package com.pos.integrations.fiscaldrive.controller;

import com.pos.config.openapi.StandardApiResponses;
import com.pos.integrations.fiscaldrive.dto.FiscalDriveSettingsResponse;
import com.pos.integrations.fiscaldrive.dto.SaveFiscalDriveSettingsRequest;
import com.pos.integrations.fiscaldrive.service.FiscalDriveSettingsService;
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
@RequestMapping("/admin/cash-registers/{cashRegisterId}/fiscal-drive")
@RequiredArgsConstructor
@PreAuthorize("hasAnyRole('ADMIN', 'SUPER_ADMIN', 'MANAGER', 'CASHIER')")
@Tag(name = "FiscalDrive", description = "Подключение кассы к FiscalDriveService (ФМ 0400)")
@StandardApiResponses
public class AdminFiscalDriveSettingsController {

    private final FiscalDriveSettingsService settingsService;

    @GetMapping
    @Operation(summary = "Настройки FiscalDrive кассы")
    public ResponseEntity<FiscalDriveSettingsResponse> get(@PathVariable Long cashRegisterId) {
        return ResponseEntity.ok(settingsService.getSettings(cashRegisterId));
    }

    @PutMapping
    @Operation(summary = "Сохранить настройки FiscalDrive кассы")
    public ResponseEntity<FiscalDriveSettingsResponse> save(
        @PathVariable Long cashRegisterId,
        @Valid @RequestBody SaveFiscalDriveSettingsRequest request
    ) {
        return ResponseEntity.ok(settingsService.saveSettings(cashRegisterId, request));
    }
}
