package com.pos.controller;

import com.pos.config.openapi.StandardApiResponses;
import com.pos.dto.telegram.MedicineSearchResponse;
import com.pos.service.telegram.TelegramMedicineSearchService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/public/bot/medicine")
@RequiredArgsConstructor
@Tag(name = "Telegram Medicine Bot", description = "Публичный поиск лекарств для Telegram-бота")
@StandardApiResponses
public class TelegramBotController {

    private final TelegramMedicineSearchService telegramMedicineSearchService;

    @GetMapping("/search")
    @Operation(summary = "Поиск лекарства", description = "Поиск по названию или штрихкоду во всех магазинах")
    @ApiResponse(responseCode = "200", description = "Результаты поиска")
    public ResponseEntity<MedicineSearchResponse> search(@RequestParam("q") String query) {
        return ResponseEntity.ok(telegramMedicineSearchService.search(query));
    }
}
