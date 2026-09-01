package com.pos.integrations.pharmacy.controller;

import com.pos.config.openapi.StandardApiResponses;
import com.pos.integrations.pharmacy.dto.AdminPharmacyIntegrationResponse;
import com.pos.integrations.pharmacy.dto.SavePharmacyIntegrationRequest;
import com.pos.integrations.pharmacy.service.PharmacyIntegrationSettingsService;
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
@RequestMapping("/admin/stores/{storeId}/pharmacy-integration")
@RequiredArgsConstructor
@PreAuthorize("hasAnyRole('ADMIN', 'SUPER_ADMIN')")
@Tag(name = "Pharmacy Integration", description = "Настройки интеграций аптечной точки")
@StandardApiResponses
public class AdminPharmacyIntegrationController {

  private final PharmacyIntegrationSettingsService settingsService;

  @GetMapping
  @Operation(summary = "Настройки интеграций аптечной точки")
  public ResponseEntity<AdminPharmacyIntegrationResponse> get(@PathVariable Integer storeId) {
    return ResponseEntity.ok(settingsService.getAdminSettings(storeId));
  }

  @PutMapping
  @Operation(summary = "Сохранить настройки интеграций аптечной точки")
  public ResponseEntity<AdminPharmacyIntegrationResponse> save(
    @PathVariable Integer storeId,
    @Valid @RequestBody SavePharmacyIntegrationRequest request
  ) {
    return ResponseEntity.ok(settingsService.saveAdminSettings(storeId, request));
  }
}
