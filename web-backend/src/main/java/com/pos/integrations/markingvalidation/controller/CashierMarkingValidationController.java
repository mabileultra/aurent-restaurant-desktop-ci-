package com.pos.integrations.markingvalidation.controller;

import com.pos.config.openapi.StandardApiResponses;
import com.pos.integrations.markingvalidation.dto.MarkingValidationResponse;
import com.pos.integrations.markingvalidation.dto.ValidateMarkingRequest;
import com.pos.integrations.markingvalidation.service.MarkingValidationService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/cashier/marking")
@RequiredArgsConstructor
@PreAuthorize("hasAnyRole('ADMIN', 'MANAGER', 'CASHIER')")
@Tag(name = "Cashier marking validation", description = "Проверка кодов маркировки в налоговой перед чеком ФМ")
@StandardApiResponses
public class CashierMarkingValidationController {

    private final MarkingValidationService validationService;

    @PostMapping("/validate")
    @Operation(summary = "Проверить коды маркировки чека (validation-onkm)")
    public ResponseEntity<MarkingValidationResponse> validate(@Valid @RequestBody ValidateMarkingRequest request) {
        return ResponseEntity.ok(validationService.validate(request));
    }
}
