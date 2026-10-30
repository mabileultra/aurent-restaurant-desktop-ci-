package com.pos.restaurant.settings.controller;

import com.pos.restaurant.settings.dto.MenuPhotoSettingsRequest;
import com.pos.restaurant.settings.dto.MenuPhotoSettingsResponse;
import com.pos.restaurant.settings.service.MenuPhotoService;
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
@Tag(name = "Menu photos", description = "Фото блюд на кассе и в меню")
public class MenuPhotoController {

    private final MenuPhotoService menuPhotoService;

    @GetMapping("/stores/{storeId}/menu-photos")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER', 'WAITER', 'CASHIER', 'COOK')")
    @Operation(summary = "Фото блюд включены или выключены")
    public MenuPhotoSettingsResponse get(@PathVariable Integer storeId) {
        return menuPhotoService.get(storeId);
    }

    @PutMapping("/stores/{storeId}/menu-photos")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
    @Operation(summary = "Включить или выключить фото блюд")
    public MenuPhotoSettingsResponse set(
        @PathVariable Integer storeId,
        @Valid @RequestBody MenuPhotoSettingsRequest request
    ) {
        return menuPhotoService.setEnabled(storeId, request.enabled());
    }
}
