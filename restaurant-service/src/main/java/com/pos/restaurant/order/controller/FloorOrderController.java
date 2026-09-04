package com.pos.restaurant.order.controller;

import com.pos.restaurant.order.domain.OrderChannel;
import com.pos.restaurant.order.dto.AddOrderItemRequest;
import com.pos.restaurant.order.dto.OpenCounterOrderRequest;
import com.pos.restaurant.order.dto.OpenOrderRequest;
import com.pos.restaurant.order.dto.OrderResponse;
import com.pos.restaurant.order.dto.UpdateGuestsRequest;
import com.pos.restaurant.order.dto.UpdateOrderItemRequest;
import com.pos.restaurant.order.service.FloorOrderService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/rst")
@RequiredArgsConstructor
@Tag(name = "Restaurant orders", description = "Заказы зала, с собой и доставки")
public class FloorOrderController {

    private final FloorOrderService orderService;

    @PostMapping("/tables/{tableId}/orders")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER', 'WAITER', 'CASHIER')")
    @Operation(summary = "Открыть заказ на столе")
    @ApiResponse(responseCode = "201", description = "Заказ создан")
    public ResponseEntity<OrderResponse> open(
        @PathVariable Integer tableId,
        @Valid @RequestBody OpenOrderRequest request
    ) {
        return ResponseEntity.status(HttpStatus.CREATED).body(orderService.open(tableId, request));
    }

    @PostMapping("/stores/{storeId}/orders/takeaway")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER', 'WAITER', 'CASHIER')")
    @Operation(summary = "Открыть заказ с собой")
    @ApiResponse(responseCode = "201", description = "Заказ создан")
    public ResponseEntity<OrderResponse> openTakeaway(
        @PathVariable Integer storeId,
        @Valid @RequestBody(required = false) OpenCounterOrderRequest request
    ) {
        return ResponseEntity.status(HttpStatus.CREATED)
            .body(orderService.openCounter(storeId, OrderChannel.TAKEAWAY, request));
    }

    @PostMapping("/stores/{storeId}/orders/delivery")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER', 'WAITER', 'CASHIER')")
    @Operation(summary = "Открыть заказ доставки")
    @ApiResponse(responseCode = "201", description = "Заказ создан")
    public ResponseEntity<OrderResponse> openDelivery(
        @PathVariable Integer storeId,
        @Valid @RequestBody OpenCounterOrderRequest request
    ) {
        return ResponseEntity.status(HttpStatus.CREATED)
            .body(orderService.openCounter(storeId, OrderChannel.DELIVERY, request));
    }

    @GetMapping("/stores/{storeId}/orders/active")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER', 'WAITER', 'CASHIER')")
    @Operation(summary = "Активные заказы канала (с собой / доставка)")
    public List<OrderResponse> listActive(
        @PathVariable Integer storeId,
        @RequestParam OrderChannel channel
    ) {
        return orderService.listActiveByChannel(storeId, channel);
    }

    @GetMapping("/orders/{orderId}")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER', 'WAITER', 'CASHIER')")
    @Operation(summary = "Детали заказа")
    public OrderResponse get(@PathVariable UUID orderId) {
        return orderService.get(orderId);
    }

    @PatchMapping("/orders/{orderId}/guests")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER', 'WAITER', 'CASHIER')")
    @Operation(summary = "Изменить количество гостей")
    public OrderResponse updateGuests(
        @PathVariable UUID orderId,
        @Valid @RequestBody UpdateGuestsRequest request
    ) {
        return orderService.updateGuests(orderId, request);
    }

    @PostMapping("/orders/{orderId}/items")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER', 'WAITER', 'CASHIER')")
    @Operation(summary = "Добавить блюдо")
    @ApiResponse(responseCode = "201", description = "Позиция добавлена")
    public ResponseEntity<OrderResponse> addItem(
        @PathVariable UUID orderId,
        @Valid @RequestBody AddOrderItemRequest request
    ) {
        return ResponseEntity.status(HttpStatus.CREATED).body(orderService.addItem(orderId, request));
    }

    @PutMapping("/orders/{orderId}/items/{itemId}")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER', 'WAITER', 'CASHIER')")
    @Operation(summary = "Изменить позицию")
    public OrderResponse updateItem(
        @PathVariable UUID orderId,
        @PathVariable UUID itemId,
        @Valid @RequestBody UpdateOrderItemRequest request
    ) {
        return orderService.updateItem(orderId, itemId, request);
    }

    @DeleteMapping("/orders/{orderId}/items/{itemId}")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER', 'WAITER', 'CASHIER')")
    @Operation(summary = "Удалить позицию")
    public OrderResponse removeItem(
        @PathVariable UUID orderId,
        @PathVariable UUID itemId
    ) {
        return orderService.removeItem(orderId, itemId);
    }

    @PostMapping("/orders/{orderId}/cancel")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER', 'WAITER', 'CASHIER')")
    @Operation(summary = "Отменить заказ")
    @ApiResponse(responseCode = "204", description = "Заказ отменён")
    public ResponseEntity<Void> cancel(@PathVariable UUID orderId) {
        orderService.cancel(orderId);
        return ResponseEntity.noContent().build();
    }
}
