package com.pos.restaurant.order.service.impl;

import com.pos.restaurant.order.dto.AssignWaiterRequest;
import com.pos.restaurant.order.dto.OrderResponse;
import com.pos.restaurant.order.entity.FloorOrder;
import com.pos.restaurant.order.repository.FloorOrderItemRepository;
import com.pos.restaurant.order.support.OrderLinkedTablesSupport;
import com.pos.restaurant.order.support.OrderLookup;
import com.pos.restaurant.order.support.OrderResponseAssembler;
import com.pos.restaurant.order.support.WaiterHistoryRecorder;
import com.pos.shared.log.LogUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.util.Objects;
import java.util.UUID;

@Component
@RequiredArgsConstructor
public class OrderAssignWaiterHandler {

    private final OrderLookup orderLookup;
    private final FloorOrderItemRepository itemRepository;
    private final OrderResponseAssembler assembler;
    private final WaiterHistoryRecorder waiterHistoryRecorder;
    private final OrderLinkedTablesSupport linkedTables;

    @Transactional
    public OrderResponse handle(UUID orderId, AssignWaiterRequest request) {
        FloorOrder order = orderLookup.requireActive(orderId);
        if (!Objects.equals(order.getWaiterUserId(), request.waiterUserId())) {
            order.setWaiterUserId(request.waiterUserId());
            waiterHistoryRecorder.record(order, request.waiterUserId());
        }
        LogUtil.info(OrderAssignWaiterHandler.class, "Waiter assigned: orderId={}, waiterUserId={}",
            orderId, request.waiterUserId());
        return assembler.toResponse(
            order,
            itemRepository.findByOrderIdOrderBySortOrderAscCreatedAtAsc(orderId),
            linkedTables.allTables(order)
        );
    }
}
