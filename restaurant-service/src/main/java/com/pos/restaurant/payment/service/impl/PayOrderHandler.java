package com.pos.restaurant.payment.service.impl;

import com.pos.restaurant.floor.domain.TableStatus;
import com.pos.restaurant.floor.support.FloorTenantSupport;
import com.pos.restaurant.order.domain.OrderStatus;
import com.pos.restaurant.order.dto.OrderResponse;
import com.pos.restaurant.order.entity.FloorOrder;
import com.pos.restaurant.order.entity.FloorOrderItem;
import com.pos.restaurant.order.repository.FloorOrderItemRepository;
import com.pos.restaurant.order.support.OrderLookup;
import com.pos.restaurant.order.support.OrderResponseAssembler;
import com.pos.restaurant.order.support.OrderTotals;
import com.pos.restaurant.payment.dto.PayOrderRequest;
import com.pos.restaurant.payment.entity.FloorOrderPayment;
import com.pos.restaurant.payment.repository.FloorOrderPaymentRepository;
import com.pos.restaurant.payment.support.BillEligibilityPolicy;
import com.pos.restaurant.recipe.service.RecipeConsumePublicationService;
import com.pos.restaurant.revenue.service.RevenuePublicationService;
import com.pos.restaurant.shift.support.ShiftLookup;
import com.pos.restaurant.shift.support.ShiftSaleAccumulator;
import com.pos.shared.log.LogUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;
import java.util.UUID;

@Component
@RequiredArgsConstructor
public class PayOrderHandler {

    private final FloorOrderItemRepository itemRepository;
    private final FloorOrderPaymentRepository paymentRepository;
    private final OrderLookup orderLookup;
    private final FloorTenantSupport tenantSupport;
    private final BillEligibilityPolicy eligibilityPolicy;
    private final OrderTotals orderTotals;
    private final OrderResponseAssembler assembler;
    private final RevenuePublicationService revenuePublicationService;
    private final RecipeConsumePublicationService recipeConsumePublicationService;
    private final ShiftLookup shiftLookup;
    private final ShiftSaleAccumulator shiftSaleAccumulator;

    @Transactional
    public OrderResponse handle(UUID orderId, PayOrderRequest request) {
        FloorOrder order = orderLookup.requireBilling(orderId);
        List<FloorOrderItem> items = itemRepository.findByOrderIdOrderBySortOrderAscCreatedAtAsc(orderId);
        BigDecimal due = orderTotals.billable(items);
        eligibilityPolicy.assertCanPay(order, due, request.amount());
        FloorOrderPayment payment = paymentRepository.save(FloorOrderPayment.builder()
            .order(order)
            .method(request.method())
            .amount(request.amount())
            .paidByUserId(tenantSupport.requireUserId())
            .build());
        order.setStatus(OrderStatus.CLOSED);
        order.setClosedAt(Instant.now());
        order.getTable().setStatus(TableStatus.CLEANING);
        if (order.getShift() != null) {
            shiftSaleAccumulator.applyPayment(order.getShift(), payment.getMethod(), payment.getAmount());
        } else {
            shiftLookup.findOpen(order.getStoreId()).ifPresent(shift ->
                shiftSaleAccumulator.applyPayment(shift, payment.getMethod(), payment.getAmount())
            );
        }
        revenuePublicationService.publishPaidOrder(order, items, payment);
        recipeConsumePublicationService.publishPaidOrder(order, items, payment);
        LogUtil.info(PayOrderHandler.class, "Order paid: orderId={}, method={}", orderId, request.method());
        return assembler.toResponse(order, items);
    }
}
