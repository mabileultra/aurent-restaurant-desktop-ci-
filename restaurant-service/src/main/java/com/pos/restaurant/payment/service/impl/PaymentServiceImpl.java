package com.pos.restaurant.payment.service.impl;

import com.pos.restaurant.order.dto.OrderResponse;
import com.pos.restaurant.payment.dto.PayOrderRequest;
import com.pos.restaurant.payment.service.PaymentService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.UUID;

@Service
@RequiredArgsConstructor
public class PaymentServiceImpl implements PaymentService {

    private final RequestBillHandler requestBillHandler;
    private final PayOrderHandler payOrderHandler;
    private final PaidOrderRefundHandler paidOrderRefundHandler;

    @Override
    public OrderResponse requestBill(UUID orderId) {
        return requestBillHandler.handle(orderId);
    }

    @Override
    public OrderResponse pay(UUID orderId, PayOrderRequest request) {
        return payOrderHandler.handle(orderId, request);
    }

    @Override
    public OrderResponse refund(UUID orderId) {
        return paidOrderRefundHandler.handle(orderId);
    }
}
