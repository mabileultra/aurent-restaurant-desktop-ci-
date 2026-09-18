package com.pos.integrations.pharmacy.controller;

import com.pos.config.openapi.StandardApiResponses;
import com.pos.integrations.pharmacy.dto.MarkingWithdrawRequest;
import com.pos.integrations.pharmacy.dto.MarkingWithdrawResponse;
import com.pos.integrations.pharmacy.service.PharmacyMarkingWithdrawService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/internal/pharmacy/marking")
@RequiredArgsConstructor
@Tag(name = "Internal Pharmacy Marking", description = "Сервис-сервис: подтверждение вывода КМ")
@StandardApiResponses
public class PharmacyMarkingInternalController {

  private final PharmacyMarkingWithdrawService withdrawService;

  @PostMapping("/withdraw")
  @Operation(summary = "Подтвердить вывод КМ (ASL status / фискал ОФД)")
  public ResponseEntity<MarkingWithdrawResponse> withdraw(@Valid @RequestBody MarkingWithdrawRequest request) {
    return ResponseEntity.ok(withdrawService.withdraw(request));
  }
}
