package com.pos.restaurant.order.service.impl;

import com.pos.restaurant.order.dto.AddOrderItemRequest;
import com.pos.restaurant.order.dto.OpenOrderRequest;
import com.pos.restaurant.order.dto.OrderResponse;
import com.pos.restaurant.order.dto.UpdateGuestsRequest;
import com.pos.restaurant.order.dto.UpdateOrderItemRequest;
import com.pos.restaurant.order.repository.FloorOrderItemRepository;
import com.pos.restaurant.order.service.FloorOrderService;
import com.pos.restaurant.order.support.OrderLookup;
import com.pos.restaurant.order.support.OrderResponseAssembler;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class FloorOrderServiceImpl implements FloorOrderService {

    private final FloorOrderItemRepository itemRepository;
    private final OrderLookup orderLookup;
    private final OrderResponseAssembler assembler;
    private final OrderOpenHandler openHandler;
    private final OrderUpdateGuestsHandler updateGuestsHandler;
    private final OrderAddItemHandler addItemHandler;
    private final OrderUpdateItemHandler updateItemHandler;
    private final OrderRemoveItemHandler removeItemHandler;
    private final OrderCancelHandler cancelHandler;

    @Override
    public OrderResponse open(Integer tableId, OpenOrderRequest request) {
        return openHandler.handle(tableId, request);
    }

    @Override
    public OrderResponse get(UUID orderId) {
        var order = orderLookup.require(orderId);
        return assembler.toResponse(order, itemRepository.findByOrderIdOrderBySortOrderAscCreatedAtAsc(orderId));
    }

    @Override
    public OrderResponse updateGuests(UUID orderId, UpdateGuestsRequest request) {
        return updateGuestsHandler.handle(orderId, request);
    }

    @Override
    public OrderResponse addItem(UUID orderId, AddOrderItemRequest request) {
        return addItemHandler.handle(orderId, request);
    }

    @Override
    public OrderResponse updateItem(UUID orderId, UUID itemId, UpdateOrderItemRequest request) {
        return updateItemHandler.handle(orderId, itemId, request);
    }

    @Override
    public OrderResponse removeItem(UUID orderId, UUID itemId) {
        return removeItemHandler.handle(orderId, itemId);
    }

    @Override
    public void cancel(UUID orderId) {
        cancelHandler.handle(orderId);
    }
}
