package com.pos.platform.controller;

import com.pos.platform.dto.platform.security.CashierServerPasswordStatusResponse;
import com.pos.platform.dto.platform.security.UpdateCashierServerPasswordRequest;
import com.pos.platform.service.PlatformSecurityService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/platform/security")
@RequiredArgsConstructor
@PreAuthorize("hasRole('SUPER_ADMIN')")
@Tag(name = "Platform Security", description = "Безопасность платформы: пароль кассы")
public class PlatformSecurityController {

    private final PlatformSecurityService platformSecurityService;

    @GetMapping("/cashier-server-password")
    @Operation(summary = "Статус пароля настройки сервера кассы")
    public ResponseEntity<CashierServerPasswordStatusResponse> getCashierServerPassword() {
        return ResponseEntity.ok(platformSecurityService.getCashierServerPasswordStatus());
    }

    @PutMapping("/cashier-server-password")
    @Operation(summary = "Задать пароль настройки сервера кассы")
    public ResponseEntity<CashierServerPasswordStatusResponse> updateCashierServerPassword(
        @Valid @RequestBody UpdateCashierServerPasswordRequest request
    ) {
        return ResponseEntity.ok(platformSecurityService.updateCashierServerPassword(request));
    }
}
