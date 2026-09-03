package com.pos.restaurant.order.service;

import com.pos.restaurant.order.dto.AddOrderItemRequest;
import com.pos.restaurant.order.dto.OpenOrderRequest;
import com.pos.restaurant.order.dto.OrderResponse;
import com.pos.restaurant.order.dto.UpdateGuestsRequest;
import com.pos.restaurant.order.dto.UpdateOrderItemRequest;

import java.util.UUID;

public interface FloorOrderService {

    OrderResponse open(Integer tableId, OpenOrderRequest request);

    OrderResponse get(UUID orderId);

    OrderResponse updateGuests(UUID orderId, UpdateGuestsRequest request);

    OrderResponse addItem(UUID orderId, AddOrderItemRequest request);

    OrderResponse updateItem(UUID orderId, UUID itemId, UpdateOrderItemRequest request);

    OrderResponse removeItem(UUID orderId, UUID itemId);

    void cancel(UUID orderId);
}
