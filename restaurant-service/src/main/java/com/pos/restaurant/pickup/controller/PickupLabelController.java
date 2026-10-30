package com.pos.restaurant.pickup.controller;

import com.pos.restaurant.order.dto.OrderResponse;
import com.pos.restaurant.pickup.service.PickupLabelService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.UUID;

@RestController
@RequestMapping("/rst")
@RequiredArgsConstructor
@Tag(name = "Restaurant pickup labels", description = "Номерок на выдачу")
public class PickupLabelController {

    private final PickupLabelService pickupLabelService;

    @PostMapping("/orders/{orderId}/pickup-label")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER', 'CASHIER')")
    @Operation(summary = "Повторить этикетку выдачи")
    public OrderResponse reprint(@PathVariable UUID orderId) {
        return pickupLabelService.reprint(orderId);
    }
}
