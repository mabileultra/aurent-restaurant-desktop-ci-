package com.pos.restaurant.payment.service.impl;

import com.pos.restaurant.order.dto.OrderResponse;
import com.pos.restaurant.payment.dto.OrderPaymentResponse;
import com.pos.restaurant.payment.dto.PaidOrderSummaryResponse;
import com.pos.restaurant.payment.dto.PartialRefundRequest;
import com.pos.restaurant.payment.dto.PayOrderRequest;
import com.pos.restaurant.payment.service.PaymentService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class PaymentServiceImpl implements PaymentService {

    private final RequestBillHandler requestBillHandler;
    private final PayOrderHandler payOrderHandler;
    private final PaidOrderRefundHandler paidOrderRefundHandler;
    private final PaidOrderPartialRefundHandler paidOrderPartialRefundHandler;
    private final ListRecentPaidOrdersHandler listRecentPaidOrdersHandler;
    private final GetOrderPaymentHandler getOrderPaymentHandler;

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

    @Override
    public OrderResponse refundItems(UUID orderId, PartialRefundRequest request) {
        return paidOrderPartialRefundHandler.handle(orderId, request);
    }

    @Override
    public List<PaidOrderSummaryResponse> listRecentPaid(Integer storeId, boolean refunded, Integer limit) {
        return listRecentPaidOrdersHandler.handle(storeId, refunded, limit);
    }

    @Override
    public OrderPaymentResponse getPayment(UUID orderId) {
        return getOrderPaymentHandler.handle(orderId);
    }
}
