package com.pos.restaurant.payment.controller;

import com.pos.restaurant.order.dto.OrderResponse;
import com.pos.restaurant.payment.dto.PayOrderRequest;
import com.pos.restaurant.payment.service.PaymentService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.UUID;

@RestController
@RequestMapping("/rst")
@RequiredArgsConstructor
@Tag(name = "Restaurant payments", description = "Счёт и оплата заказа")
public class PaymentController {

    private final PaymentService paymentService;

    @PostMapping("/orders/{orderId}/bill")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER', 'WAITER', 'CASHIER')")
    @Operation(summary = "Выставить счёт")
    public OrderResponse requestBill(@PathVariable UUID orderId) {
        return paymentService.requestBill(orderId);
    }

    @PostMapping("/orders/{orderId}/pay")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER', 'WAITER', 'CASHIER')")
    @Operation(summary = "Принять оплату")
    public OrderResponse pay(
        @PathVariable UUID orderId,
        @Valid @RequestBody PayOrderRequest request
    ) {
        return paymentService.pay(orderId, request);
    }
}
