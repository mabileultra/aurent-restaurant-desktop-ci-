package com.pos.restaurant.payment.service.impl;

import com.pos.restaurant.exception.BusinessException;
import com.pos.restaurant.floor.domain.TableStatus;
import com.pos.restaurant.order.domain.OrderStatus;
import com.pos.restaurant.order.dto.OrderResponse;
import com.pos.restaurant.order.entity.FloorOrder;
import com.pos.restaurant.order.entity.FloorOrderItem;
import com.pos.restaurant.order.repository.FloorOrderItemRepository;
import com.pos.restaurant.order.support.OrderLookup;
import com.pos.restaurant.order.support.OrderResponseAssembler;
import com.pos.restaurant.payment.entity.FloorOrderPayment;
import com.pos.restaurant.payment.repository.FloorOrderPaymentRepository;
import com.pos.restaurant.recipe.service.RecipeStockRestoreService;
import com.pos.restaurant.revenue.service.RestaurantRefundPublicationService;
import com.pos.restaurant.shift.support.ShiftSaleAccumulator;
import com.pos.shared.log.LogUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Component
@RequiredArgsConstructor
public class PaidOrderRefundHandler {

    private final FloorOrderItemRepository itemRepository;
    private final FloorOrderPaymentRepository paymentRepository;
    private final OrderLookup orderLookup;
    private final OrderResponseAssembler assembler;
    private final ShiftSaleAccumulator shiftSaleAccumulator;
    private final RestaurantRefundPublicationService refundPublicationService;
    private final RecipeStockRestoreService recipeStockRestoreService;

    @Transactional
    public OrderResponse handle(UUID orderId) {
        FloorOrder order = orderLookup.requireClosed(orderId);
        FloorOrderPayment payment = paymentRepository.findFirstByOrder_IdOrderByPaidAtDesc(orderId)
            .orElseThrow(() -> new BusinessException("У оплаченного заказа нет платежа"));
        List<FloorOrderItem> items = itemRepository.findByOrderIdOrderBySortOrderAscCreatedAtAsc(orderId);
        if (order.getShift() != null) {
            shiftSaleAccumulator.applyRefund(order.getShift(), payment.getMethod(), payment.getAmount());
        }
        order.setStatus(OrderStatus.REFUNDED);
        order.setCommissionAmount(java.math.BigDecimal.ZERO);
        if (order.getTable() != null && order.getTable().getStatus() == TableStatus.CLEANING) {
            order.getTable().setStatus(TableStatus.FREE);
        }
        refundPublicationService.publish(order, items, payment);
        recipeStockRestoreService.restorePaidOrder(order, items, payment);
        LogUtil.info(PaidOrderRefundHandler.class, "Paid order refunded: orderId={}", orderId);
        return assembler.toResponse(order, items);
    }
}
