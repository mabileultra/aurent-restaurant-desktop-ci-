package com.pos.restaurant.kitchen.controller;

import com.pos.restaurant.kitchen.dto.KitchenTicketResponse;
import com.pos.restaurant.kitchen.dto.UpdateTicketStatusRequest;
import com.pos.restaurant.kitchen.service.KitchenTicketService;
import com.pos.restaurant.order.dto.OrderResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/rst")
@RequiredArgsConstructor
@Tag(name = "Kitchen tickets", description = "Отправка на кухню и KDS")
public class KitchenTicketController {

    private final KitchenTicketService ticketService;

    @PostMapping("/orders/{orderId}/send-to-kitchen")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER', 'WAITER', 'CASHIER')")
    @Operation(summary = "Отправить новые позиции на кухню")
    public OrderResponse send(@PathVariable UUID orderId) {
        return ticketService.send(orderId);
    }

    @GetMapping("/stores/{storeId}/kitchen-tickets")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER', 'WAITER', 'CASHIER', 'COOK')")
    @Operation(summary = "Доска кухни")
    public List<KitchenTicketResponse> board(
        @PathVariable Integer storeId,
        @RequestParam(required = false) UUID stationId
    ) {
        return ticketService.listBoard(storeId, stationId);
    }

    @PatchMapping("/kitchen-tickets/{ticketId}/status")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER', 'COOK')")
    @Operation(summary = "Сменить статус тикета")
    public KitchenTicketResponse updateStatus(
        @PathVariable UUID ticketId,
        @Valid @RequestBody UpdateTicketStatusRequest request
    ) {
        return ticketService.updateStatus(ticketId, request.status());
    }
}
