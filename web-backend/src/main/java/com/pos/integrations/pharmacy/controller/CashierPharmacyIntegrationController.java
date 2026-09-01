package com.pos.integrations.pharmacy.controller;

import com.pos.config.openapi.StandardApiResponses;
import com.pos.integrations.pharmacy.dto.CashierPharmacyIntegrationResponse;
import com.pos.integrations.pharmacy.dto.MarkingVerifyRequest;
import com.pos.integrations.pharmacy.dto.MarkingVerifyResponse;
import com.pos.integrations.pharmacy.service.PharmacyIntegrationSettingsService;
import com.pos.service.support.TenantAccessSupport;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/cashier/pharmacy-integration")
@RequiredArgsConstructor
@PreAuthorize("hasAnyRole('ADMIN', 'MANAGER', 'CASHIER')")
@Tag(name = "Cashier Pharmacy Integration", description = "Интеграции аптечной кассы")
@StandardApiResponses
public class CashierPharmacyIntegrationController {

  private final PharmacyIntegrationSettingsService settingsService;
  private final TenantAccessSupport tenantAccess;

  @GetMapping
  @Operation(summary = "Возможности интеграций для аптечной кассы")
  public ResponseEntity<CashierPharmacyIntegrationResponse> capabilities(@RequestParam Integer storeId) {
    return ResponseEntity.ok(settingsService.getCashierCapabilities(tenantAccess.currentUser(), storeId));
  }

  @PostMapping("/marking/verify")
  @Operation(summary = "Проверка кода маркировки ASL Belgisi")
  public ResponseEntity<MarkingVerifyResponse> verifyMarking(@Valid @RequestBody MarkingVerifyRequest request) {
    MarkingVerifyResponse response = settingsService.verifyMarking(
      tenantAccess.currentUser(),
      request.storeId(),
      request.code()
    );
    return ResponseEntity.ok(response);
  }
}
