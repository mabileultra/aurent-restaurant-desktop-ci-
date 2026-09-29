package com.pos.restaurant.settings.controller;

import com.pos.restaurant.settings.dto.KitchenBoardSettingsRequest;
import com.pos.restaurant.settings.dto.KitchenBoardSettingsResponse;
import com.pos.restaurant.settings.service.KitchenBoardService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/rst")
@RequiredArgsConstructor
@Tag(name = "Kitchen board", description = "Включение кухонной доски для магазина")
public class KitchenBoardController {

    private final KitchenBoardService kitchenBoardService;

    @GetMapping("/stores/{storeId}/kitchen-board")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER', 'WAITER', 'CASHIER', 'COOK')")
    @Operation(summary = "Кухонная доска включена или выключена")
    public KitchenBoardSettingsResponse get(@PathVariable Integer storeId) {
        return kitchenBoardService.get(storeId);
    }

    @PutMapping("/stores/{storeId}/kitchen-board")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
    @Operation(summary = "Включить или выключить кухонную доску")
    public KitchenBoardSettingsResponse set(
        @PathVariable Integer storeId,
        @Valid @RequestBody KitchenBoardSettingsRequest request
    ) {
        return kitchenBoardService.setEnabled(storeId, request.enabled());
    }
}
