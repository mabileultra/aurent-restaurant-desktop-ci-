package com.pos.restaurant.order.service.impl;

import com.pos.restaurant.floor.support.FloorTenantSupport;
import com.pos.restaurant.order.domain.OrderChannel;
import com.pos.restaurant.order.domain.OrderStatus;
import com.pos.restaurant.order.dto.AddOrderItemRequest;
import com.pos.restaurant.order.dto.OpenCounterOrderRequest;
import com.pos.restaurant.order.dto.OpenOrderRequest;
import com.pos.restaurant.order.dto.OrderResponse;
import com.pos.restaurant.order.dto.UpdateGuestsRequest;
import com.pos.restaurant.order.dto.UpdateOrderItemRequest;
import com.pos.restaurant.order.entity.FloorOrder;
import com.pos.restaurant.order.repository.FloorOrderItemRepository;
import com.pos.restaurant.order.repository.FloorOrderRepository;
import com.pos.restaurant.order.service.FloorOrderService;
import com.pos.restaurant.order.support.OrderLookup;
import com.pos.restaurant.order.support.OrderResponseAssembler;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class FloorOrderServiceImpl implements FloorOrderService {

    private final FloorOrderItemRepository itemRepository;
    private final FloorOrderRepository orderRepository;
    private final FloorTenantSupport tenantSupport;
    private final OrderLookup orderLookup;
    private final OrderResponseAssembler assembler;
    private final OrderOpenHandler openHandler;
    private final OrderOpenCounterHandler openCounterHandler;
    private final OrderUpdateGuestsHandler updateGuestsHandler;
    private final OrderAddItemHandler addItemHandler;
    private final OrderUpdateItemHandler updateItemHandler;
    private final OrderRemoveItemHandler removeItemHandler;
    private final OrderCancelHandler cancelHandler;

    @Override
    @Transactional
    public OrderResponse open(Integer tableId, OpenOrderRequest request) {
        return openHandler.handle(tableId, request);
    }

    @Override
    @Transactional
    public OrderResponse openCounter(Integer storeId, OrderChannel channel, OpenCounterOrderRequest request) {
        return openCounterHandler.handle(storeId, channel, request);
    }

    @Override
    public List<OrderResponse> listActiveByChannel(Integer storeId, OrderChannel channel) {
        Integer companyId = tenantSupport.requireCompanyId();
        List<FloorOrder> orders = orderRepository.findByCompanyIdAndStoreIdAndChannelAndStatusIn(
            companyId,
            storeId,
            channel,
            List.of(OrderStatus.OPEN, OrderStatus.BILLING)
        );
        return orders.stream()
            .map(order -> assembler.toResponse(
                order,
                itemRepository.findByOrderIdOrderBySortOrderAscCreatedAtAsc(order.getId())
            ))
            .toList();
    }

    @Override
    public OrderResponse get(UUID orderId) {
        var order = orderLookup.require(orderId);
        return assembler.toResponse(order, itemRepository.findByOrderIdOrderBySortOrderAscCreatedAtAsc(orderId));
    }

    @Override
    @Transactional
    public OrderResponse updateGuests(UUID orderId, UpdateGuestsRequest request) {
        return updateGuestsHandler.handle(orderId, request);
    }

    @Override
    @Transactional
    public OrderResponse addItem(UUID orderId, AddOrderItemRequest request) {
        return addItemHandler.handle(orderId, request);
    }

    @Override
    @Transactional
    public OrderResponse updateItem(UUID orderId, UUID itemId, UpdateOrderItemRequest request) {
        return updateItemHandler.handle(orderId, itemId, request);
    }

    @Override
    @Transactional
    public OrderResponse removeItem(UUID orderId, UUID itemId) {
        return removeItemHandler.handle(orderId, itemId);
    }

    @Override
    @Transactional
    public void cancel(UUID orderId) {
        cancelHandler.handle(orderId);
    }
}
