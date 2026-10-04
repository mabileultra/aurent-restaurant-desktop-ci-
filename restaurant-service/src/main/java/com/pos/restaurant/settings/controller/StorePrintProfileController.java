package com.pos.restaurant.settings.controller;

import com.pos.restaurant.settings.dto.StorePrintProfileRequest;
import com.pos.restaurant.settings.dto.StorePrintProfileResponse;
import com.pos.restaurant.settings.service.StorePrintProfileService;
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
@Tag(name = "Store print profile", description = "Оформление чеков ресторана: лого, шрифты, поля")
public class StorePrintProfileController {

    private final StorePrintProfileService printProfileService;

    @GetMapping("/stores/{storeId}/print-profile")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER', 'WAITER', 'CASHIER', 'COOK')")
    @Operation(summary = "Профиль печати магазина")
    public StorePrintProfileResponse get(@PathVariable Integer storeId) {
        return printProfileService.get(storeId);
    }

    @PutMapping("/stores/{storeId}/print-profile")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
    @Operation(summary = "Сохранить профиль печати")
    public StorePrintProfileResponse save(
        @PathVariable Integer storeId,
        @Valid @RequestBody StorePrintProfileRequest request
    ) {
        return printProfileService.save(storeId, request.profile());
    }
}
