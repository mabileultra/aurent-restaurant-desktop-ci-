package com.pos.telegram.controller;

import com.pos.config.openapi.StandardApiResponses;
import com.pos.telegram.dto.MedicineSearchItemDto;
import com.pos.telegram.dto.MedicineSearchResponse;
import com.pos.telegram.dto.TelegramStoreDto;
import com.pos.telegram.service.TelegramMedicineSearchService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/public/bot")
@RequiredArgsConstructor
@Tag(name = "Telegram Medicine Bot", description = "Публичный API для Telegram-бота Aurent")
@StandardApiResponses
public class TelegramBotController {

    private final TelegramMedicineSearchService telegramMedicineSearchService;

    @GetMapping("/medicine/search")
    @Operation(summary = "Поиск лекарства", description = "Поиск по названию или штрихкоду во всех магазинах")
    @ApiResponse(responseCode = "200", description = "Результаты поиска")
    public ResponseEntity<MedicineSearchResponse> search(@RequestParam("q") String query) {
        return ResponseEntity.ok(telegramMedicineSearchService.search(query));
    }

    @GetMapping("/medicine/{productId}")
    @Operation(summary = "Карточка лекарства", description = "Наличие и цены по магазинам для выбранного товара")
    @ApiResponse(responseCode = "200", description = "Данные товара")
    public ResponseEntity<MedicineSearchItemDto> product(@PathVariable UUID productId) {
        return ResponseEntity.ok(telegramMedicineSearchService.getProductAvailability(productId));
    }

    @GetMapping("/stores")
    @Operation(summary = "Список аптек", description = "Активные магазины для сценария «Аптеки рядом»")
    @ApiResponse(responseCode = "200", description = "Список магазинов")
    public ResponseEntity<List<TelegramStoreDto>> stores() {
        return ResponseEntity.ok(telegramMedicineSearchService.listActiveStores());
    }
}
