package com.pos.restaurant.payment.service;

import com.pos.restaurant.order.dto.OrderResponse;
import com.pos.restaurant.payment.dto.OrderPaymentResponse;
import com.pos.restaurant.payment.dto.PaidOrderSummaryResponse;
import com.pos.restaurant.payment.dto.PartialRefundRequest;
import com.pos.restaurant.payment.dto.PayOrderRequest;

import java.util.List;
import java.util.UUID;

public interface PaymentService {

    OrderResponse requestBill(UUID orderId);

    OrderResponse pay(UUID orderId, PayOrderRequest request);

    OrderResponse refund(UUID orderId);

    OrderResponse refundItems(UUID orderId, PartialRefundRequest request);

    List<PaidOrderSummaryResponse> listRecentPaid(Integer storeId, boolean refunded, Integer limit);

    OrderPaymentResponse getPayment(UUID orderId);
}
