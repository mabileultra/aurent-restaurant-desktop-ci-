package com.pos.telegram.controller;

import com.pos.config.openapi.StandardApiResponses;
import com.pos.telegram.dto.TelegramBotRuntimeInstanceDto;
import com.pos.telegram.service.CompanyTelegramBotService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/public/bot/runtime")
@RequiredArgsConstructor
@Tag(name = "Telegram Bot Runtime", description = "Конфиг для multi-bot runner")
@StandardApiResponses
public class TelegramBotRuntimeController {

    private final CompanyTelegramBotService companyTelegramBotService;

    @GetMapping("/instances")
    @Operation(summary = "Активные боты компаний", description = "Требует X-Bot-Runtime-Token")
    @ApiResponse(responseCode = "200", description = "Список инстансов")
    public ResponseEntity<List<TelegramBotRuntimeInstanceDto>> instances() {
        return ResponseEntity.ok(companyTelegramBotService.listRuntimeInstances());
    }
}
