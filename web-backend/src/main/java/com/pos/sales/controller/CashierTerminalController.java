package com.pos.sales.controller;

import com.pos.config.openapi.StandardApiResponses;
import com.pos.sales.dto.cashregister.RegisterTerminalRequest;
import com.pos.sales.dto.cashregister.RegisterTerminalResponse;
import com.pos.sales.service.CashRegisterTerminalService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/cashier/terminal")
@RequiredArgsConstructor
@Tag(name = "Cashier Terminal", description = "Регистрация рабочей кассы/desktop")
@StandardApiResponses
public class CashierTerminalController {

    private final CashRegisterTerminalService cashRegisterTerminalService;

    @PostMapping("/register")
    @PreAuthorize("hasAnyRole('CASHIER', 'WAITER')")
    @Operation(summary = "Зарегистрировать терминал", description = "Создаёт или обновляет запись кассы по deviceId / SN")
    @ApiResponse(responseCode = "200", description = "Касса зарегистрирована")
    public ResponseEntity<RegisterTerminalResponse> register(
        @RequestParam Integer storeId,
        @Valid @RequestBody RegisterTerminalRequest request
    ) {
        return ResponseEntity.ok(cashRegisterTerminalService.registerForStore(storeId, request));
    }
}
