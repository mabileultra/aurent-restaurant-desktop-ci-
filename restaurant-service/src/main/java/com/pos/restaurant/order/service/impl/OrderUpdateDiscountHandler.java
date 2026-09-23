package com.pos.restaurant.order.service.impl;

import com.pos.restaurant.exception.BusinessException;
import com.pos.restaurant.order.dto.OrderResponse;
import com.pos.restaurant.order.dto.UpdateOrderDiscountRequest;
import com.pos.restaurant.order.entity.FloorOrder;
import com.pos.restaurant.order.entity.FloorOrderItem;
import com.pos.restaurant.order.repository.FloorOrderItemRepository;
import com.pos.restaurant.order.support.OrderLookup;
import com.pos.restaurant.order.support.OrderResponseAssembler;
import com.pos.restaurant.order.support.OrderTotals;
import com.pos.shared.log.LogUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.List;
import java.util.UUID;

@Component
@RequiredArgsConstructor
public class OrderUpdateDiscountHandler {

    private final FloorOrderItemRepository itemRepository;
    private final OrderLookup orderLookup;
    private final OrderTotals orderTotals;
    private final OrderResponseAssembler assembler;

    @Transactional
    public OrderResponse handle(UUID orderId, UpdateOrderDiscountRequest request) {
        FloorOrder order = orderLookup.requireActive(orderId);
        BigDecimal discount = request.discountAmount() == null
            ? BigDecimal.ZERO
            : request.discountAmount().setScale(2, RoundingMode.HALF_UP);
        if (discount.compareTo(BigDecimal.ZERO) < 0) {
            throw new BusinessException("Discount cannot be negative");
        }

        List<FloorOrderItem> items = itemRepository.findByOrderIdOrderBySortOrderAscCreatedAtAsc(orderId);
        BigDecimal subtotal = orderTotals.billable(items);
        if (discount.compareTo(subtotal) > 0) {
            throw new BusinessException("Discount cannot exceed order subtotal");
        }

        order.setDiscountAmount(discount);
        LogUtil.info(OrderUpdateDiscountHandler.class, "Order discount set: id={}, amount={}", orderId, discount);
        return assembler.toResponse(order, items);
    }
}
