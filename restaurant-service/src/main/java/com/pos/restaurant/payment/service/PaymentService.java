package com.pos.restaurant.payment.service;

import com.pos.restaurant.order.dto.OrderResponse;
import com.pos.restaurant.payment.dto.PayOrderRequest;

import java.util.UUID;

public interface PaymentService {

    OrderResponse requestBill(UUID orderId);

    OrderResponse pay(UUID orderId, PayOrderRequest request);
}
