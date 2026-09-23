package com.pos.restaurant.order.service.impl;

import com.pos.restaurant.exception.BusinessException;
import com.pos.restaurant.order.domain.DeliveryStatus;
import com.pos.restaurant.order.domain.OrderChannel;
import com.pos.restaurant.order.domain.OrderStatus;
import com.pos.restaurant.order.dto.OrderResponse;
import com.pos.restaurant.order.dto.UpdateDeliveryStatusRequest;
import com.pos.restaurant.order.entity.FloorOrder;
import com.pos.restaurant.order.repository.FloorOrderItemRepository;
import com.pos.restaurant.order.support.OrderLookup;
import com.pos.restaurant.order.support.OrderResponseAssembler;
import com.pos.shared.log.LogUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.util.EnumSet;
import java.util.Set;
import java.util.UUID;

@Component
@RequiredArgsConstructor
public class OrderUpdateDeliveryStatusHandler {

    private static final Set<OrderStatus> BLOCKED = EnumSet.of(
        OrderStatus.CANCELLED,
        OrderStatus.REFUNDED
    );

    private final FloorOrderItemRepository itemRepository;
    private final OrderLookup orderLookup;
    private final OrderResponseAssembler assembler;

    @Transactional
    public OrderResponse handle(UUID orderId, UpdateDeliveryStatusRequest request) {
        FloorOrder order = orderLookup.require(orderId);
        if (order.getChannel() != OrderChannel.DELIVERY) {
            throw new BusinessException("Only delivery orders have delivery status");
        }
        if (BLOCKED.contains(order.getStatus())) {
            throw new BusinessException("Cannot update delivery status for cancelled/refunded order");
        }
        DeliveryStatus next = request.deliveryStatus();
        if (next == null) {
            throw new BusinessException("Delivery status is required");
        }
        order.setDeliveryStatus(next);
        LogUtil.info(OrderUpdateDeliveryStatusHandler.class, "Delivery status {}: id={}", next, orderId);
        return assembler.toResponse(
            order,
            itemRepository.findByOrderIdOrderBySortOrderAscCreatedAtAsc(orderId)
        );
    }
}
