package com.pos.restaurant.payment.controller;

import com.pos.restaurant.order.dto.OrderResponse;
import com.pos.restaurant.payment.dto.OrderPaymentResponse;
import com.pos.restaurant.payment.dto.PaidOrderSummaryResponse;
import com.pos.restaurant.payment.dto.PartialRefundRequest;
import com.pos.restaurant.payment.dto.PayOrderRequest;
import com.pos.restaurant.payment.service.PaymentService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
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
@Tag(name = "Restaurant payments", description = "Счёт и оплата заказа")
public class PaymentController {

    private final PaymentService paymentService;

    @PostMapping("/orders/{orderId}/bill")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER', 'CASHIER')")
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

    @PostMapping("/orders/{orderId}/refund")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER', 'CASHIER')")
    @Operation(summary = "Вернуть оплаченный заказ")
    public OrderResponse refund(@PathVariable UUID orderId) {
        return paymentService.refund(orderId);
    }

    @PostMapping("/orders/{orderId}/refund-items")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER', 'CASHIER')")
    @Operation(summary = "Частичный возврат позиций оплаченного заказа")
    public OrderResponse refundItems(
        @PathVariable UUID orderId,
        @Valid @RequestBody PartialRefundRequest request
    ) {
        return paymentService.refundItems(orderId, request);
    }

    @GetMapping("/stores/{storeId}/orders/recent-paid")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER', 'WAITER', 'CASHIER')")
    @Operation(summary = "Недавние оплаченные / возвращённые заказы")
    public List<PaidOrderSummaryResponse> listRecentPaid(
        @PathVariable Integer storeId,
        @RequestParam(defaultValue = "false") boolean refunded,
        @RequestParam(required = false) Integer limit
    ) {
        return paymentService.listRecentPaid(storeId, refunded, limit);
    }

    @GetMapping("/orders/{orderId}/payment")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER', 'WAITER', 'CASHIER')")
    @Operation(summary = "Платёж по заказу")
    public OrderPaymentResponse getPayment(@PathVariable UUID orderId) {
        return paymentService.getPayment(orderId);
    }
}
