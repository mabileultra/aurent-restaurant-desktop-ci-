package com.pos.restaurant.order.service;

import com.pos.restaurant.order.domain.DeliveryStatus;
import com.pos.restaurant.order.domain.OrderChannel;
import com.pos.restaurant.order.domain.OrderStatus;
import com.pos.restaurant.order.dto.AddOrderItemRequest;
import com.pos.restaurant.order.dto.AssignWaiterRequest;
import com.pos.restaurant.order.dto.MergeTablesRequest;
import com.pos.restaurant.order.dto.OpenCounterOrderRequest;
import com.pos.restaurant.order.dto.OpenOrderRequest;
import com.pos.restaurant.order.dto.OrderResponse;
import com.pos.restaurant.order.dto.TransferTableRequest;
import com.pos.restaurant.order.dto.UpdateDeliveryDetailsRequest;
import com.pos.restaurant.order.dto.UpdateDeliveryStatusRequest;
import com.pos.restaurant.order.dto.UpdateGuestsRequest;
import com.pos.restaurant.order.dto.UpdateOrderDiscountRequest;
import com.pos.restaurant.order.dto.UpdateOrderItemRequest;
import com.pos.restaurant.payment.dto.PaidOrderSummaryResponse;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

public interface FloorOrderService {

    OrderResponse open(Integer tableId, OpenOrderRequest request);

    OrderResponse openCounter(Integer storeId, OrderChannel channel, OpenCounterOrderRequest request);

    List<OrderResponse> listActiveByChannel(Integer storeId, OrderChannel channel);

    List<PaidOrderSummaryResponse> listRecentCancelled(Integer storeId, Integer limit);

    Page<OrderResponse> searchByChannel(
        Integer storeId,
        OrderChannel channel,
        OrderStatus status,
        DeliveryStatus deliveryStatus,
        String q,
        Instant openedFrom,
        Instant openedTo,
        Pageable pageable
    );

    OrderResponse get(UUID orderId);

    OrderResponse updateGuests(UUID orderId, UpdateGuestsRequest request);

    OrderResponse updateDeliveryDetails(UUID orderId, UpdateDeliveryDetailsRequest request);

    OrderResponse updateDeliveryStatus(UUID orderId, UpdateDeliveryStatusRequest request);

    OrderResponse updateDiscount(UUID orderId, UpdateOrderDiscountRequest request);

    OrderResponse assignWaiter(UUID orderId, AssignWaiterRequest request);

    OrderResponse transferTable(UUID orderId, TransferTableRequest request);

    OrderResponse mergeTables(UUID orderId, MergeTablesRequest request);

    OrderResponse addItem(UUID orderId, AddOrderItemRequest request);

    OrderResponse updateItem(UUID orderId, UUID itemId, UpdateOrderItemRequest request);

    OrderResponse removeItem(UUID orderId, UUID itemId);

    void cancel(UUID orderId);
}
