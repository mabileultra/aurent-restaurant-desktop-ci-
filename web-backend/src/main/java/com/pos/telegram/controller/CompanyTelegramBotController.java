package com.pos.telegram.controller;

import com.pos.config.openapi.StandardApiResponses;
import com.pos.telegram.dto.CompanyTelegramBotResponse;
import com.pos.telegram.dto.UpsertCompanyTelegramBotRequest;
import com.pos.telegram.service.CompanyTelegramBotService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
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
@RequestMapping("/company-telegram-bot")
@RequiredArgsConstructor
@Tag(name = "Company Telegram Bot", description = "Аптечный Telegram-бот текущей компании")
@StandardApiResponses
public class CompanyTelegramBotController {

    private final CompanyTelegramBotService companyTelegramBotService;

    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
    @Operation(summary = "Настройки бота компании")
    @ApiResponse(responseCode = "200", description = "Текущие настройки")
    public ResponseEntity<CompanyTelegramBotResponse> get() {
        return ResponseEntity.ok(companyTelegramBotService.getForCurrentCompany());
    }

    @PutMapping
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Сохранить бота компании", description = "Каждая аптечная компания — свой бот и свои магазины")
    @ApiResponse(responseCode = "200", description = "Сохранено")
    public ResponseEntity<CompanyTelegramBotResponse> upsert(@Valid @RequestBody UpsertCompanyTelegramBotRequest request) {
        return ResponseEntity.ok(companyTelegramBotService.upsertForCurrentCompany(request));
    }
}
