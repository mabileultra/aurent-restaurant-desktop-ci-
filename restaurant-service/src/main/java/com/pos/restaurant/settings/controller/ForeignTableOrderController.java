package com.pos.restaurant.settings.controller;

import com.pos.restaurant.settings.dto.ForeignTableOrderSettingsRequest;
import com.pos.restaurant.settings.dto.ForeignTableOrderSettingsResponse;
import com.pos.restaurant.settings.service.ForeignTableOrderService;
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
@Tag(name = "Foreign table orders", description = "Можно ли официанту бить товар на чужой открытый стол")
public class ForeignTableOrderController {

    private final ForeignTableOrderService foreignTableOrderService;

    @GetMapping("/stores/{storeId}/foreign-table-orders")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER', 'WAITER', 'CASHIER')")
    @Operation(summary = "Разрешены ли чужие открытые столы для официанта")
    public ForeignTableOrderSettingsResponse get(@PathVariable Integer storeId) {
        return foreignTableOrderService.get(storeId);
    }

    @PutMapping("/stores/{storeId}/foreign-table-orders")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
    @Operation(summary = "Включить или выключить работу официанта на чужих столах")
    public ForeignTableOrderSettingsResponse set(
        @PathVariable Integer storeId,
        @Valid @RequestBody ForeignTableOrderSettingsRequest request
    ) {
        return foreignTableOrderService.setAllowed(storeId, request.allowed());
    }
}
