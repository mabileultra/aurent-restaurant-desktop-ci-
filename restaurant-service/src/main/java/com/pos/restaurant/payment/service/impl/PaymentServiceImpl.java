package com.pos.restaurant.payment.service.impl;

import com.pos.restaurant.floor.revision.FloorRevisionBump;
import com.pos.restaurant.order.domain.OrderStatus;
import com.pos.restaurant.order.dto.OrderResponse;
import com.pos.restaurant.security.RestaurantTenantContext;
import com.pos.restaurant.payment.dto.OrderPaymentResponse;
import com.pos.restaurant.payment.dto.PaidOrderSummaryResponse;
import com.pos.restaurant.payment.dto.PartialRefundRequest;
import com.pos.restaurant.payment.dto.PayOrderRequest;
import com.pos.restaurant.payment.service.PaymentService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

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
    private final FloorRevisionBump floorRevision;

    private OrderResponse touchFloor(OrderResponse response) {
        if (response != null && onFloorTile(response)) {
            floorRevision.bump(RestaurantTenantContext.getCompanyId(), response.storeId());
        }
        return response;
    }

    private OrderResponse touchIfRefunded(OrderResponse response) {
        if (response != null && response.status() == OrderStatus.REFUNDED) {
            return touchFloor(response);
        }
        return response;
    }

    private static boolean onFloorTile(OrderResponse response) {
        if (response.tableId() != null) {
            return true;
        }
        return response.linkedTables() != null && !response.linkedTables().isEmpty();
    }

    @Override
    @Transactional
    public OrderResponse requestBill(UUID orderId) {
        return touchFloor(requestBillHandler.handle(orderId));
    }

    @Override
    @Transactional
    public OrderResponse pay(UUID orderId, PayOrderRequest request) {
        return touchFloor(payOrderHandler.handle(orderId, request));
    }

    @Override
    @Transactional
    public OrderResponse refund(UUID orderId) {
        return touchIfRefunded(paidOrderRefundHandler.handle(orderId));
    }

    @Override
    @Transactional
    public OrderResponse refundItems(UUID orderId, PartialRefundRequest request) {
        return touchIfRefunded(paidOrderPartialRefundHandler.handle(orderId, request));
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
