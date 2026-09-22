package com.pos.restaurant.order.service;

import com.pos.restaurant.order.domain.OrderChannel;
import com.pos.restaurant.order.dto.AddOrderItemRequest;
import com.pos.restaurant.order.dto.AssignWaiterRequest;
import com.pos.restaurant.order.dto.MergeTablesRequest;
import com.pos.restaurant.order.dto.OpenCounterOrderRequest;
import com.pos.restaurant.order.dto.OpenOrderRequest;
import com.pos.restaurant.order.dto.OrderResponse;
import com.pos.restaurant.order.dto.TransferTableRequest;
import com.pos.restaurant.order.dto.UpdateGuestsRequest;
import com.pos.restaurant.order.dto.UpdateOrderItemRequest;

import java.util.List;
import java.util.UUID;

public interface FloorOrderService {

    OrderResponse open(Integer tableId, OpenOrderRequest request);

    OrderResponse openCounter(Integer storeId, OrderChannel channel, OpenCounterOrderRequest request);

    List<OrderResponse> listActiveByChannel(Integer storeId, OrderChannel channel);

    OrderResponse get(UUID orderId);

    OrderResponse updateGuests(UUID orderId, UpdateGuestsRequest request);

    OrderResponse assignWaiter(UUID orderId, AssignWaiterRequest request);

    OrderResponse transferTable(UUID orderId, TransferTableRequest request);

    OrderResponse mergeTables(UUID orderId, MergeTablesRequest request);

    OrderResponse addItem(UUID orderId, AddOrderItemRequest request);

    OrderResponse updateItem(UUID orderId, UUID itemId, UpdateOrderItemRequest request);

    OrderResponse removeItem(UUID orderId, UUID itemId);

    void cancel(UUID orderId);
}
