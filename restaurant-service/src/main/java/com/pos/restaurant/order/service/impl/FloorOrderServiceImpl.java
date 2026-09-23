package com.pos.restaurant.order.service.impl;

import com.pos.restaurant.floor.support.FloorTenantSupport;
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
import com.pos.restaurant.order.entity.FloorOrder;
import com.pos.restaurant.order.entity.FloorOrderItem;
import com.pos.restaurant.order.repository.FloorOrderItemRepository;
import com.pos.restaurant.order.repository.FloorOrderRepository;
import com.pos.restaurant.order.service.FloorOrderService;
import com.pos.restaurant.order.support.OrderLinkedTablesSupport;
import com.pos.restaurant.order.support.OrderLookup;
import com.pos.restaurant.order.support.OrderResponseAssembler;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.Collections;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class FloorOrderServiceImpl implements FloorOrderService {

    private final FloorOrderItemRepository itemRepository;
    private final FloorOrderRepository orderRepository;
    private final FloorTenantSupport tenantSupport;
    private final OrderLookup orderLookup;
    private final OrderResponseAssembler assembler;
    private final OrderLinkedTablesSupport linkedTables;
    private final OrderOpenHandler openHandler;
    private final OrderOpenCounterHandler openCounterHandler;
    private final OrderUpdateGuestsHandler updateGuestsHandler;
    private final OrderUpdateDeliveryDetailsHandler updateDeliveryDetailsHandler;
    private final OrderUpdateDeliveryStatusHandler updateDeliveryStatusHandler;
    private final OrderUpdateDiscountHandler updateDiscountHandler;
    private final OrderAddItemHandler addItemHandler;
    private final OrderUpdateItemHandler updateItemHandler;
    private final OrderRemoveItemHandler removeItemHandler;
    private final OrderCancelHandler cancelHandler;
    private final OrderAssignWaiterHandler assignWaiterHandler;
    private final OrderTransferTableHandler transferTableHandler;
    private final OrderMergeTablesHandler mergeTablesHandler;

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
        if (orders.isEmpty()) {
            return List.of();
        }
        List<UUID> orderIds = orders.stream().map(FloorOrder::getId).toList();
        Map<UUID, List<FloorOrderItem>> itemsByOrder = itemRepository.findByOrderIdInOrdered(orderIds).stream()
            .collect(Collectors.groupingBy(item -> item.getOrder().getId()));
        return orders.stream()
            .map(order -> assembler.toBoardCard(
                order,
                itemsByOrder.getOrDefault(order.getId(), Collections.emptyList())
            ))
            .toList();
    }

    @Override
    public Page<OrderResponse> searchByChannel(
        Integer storeId,
        OrderChannel channel,
        OrderStatus status,
        DeliveryStatus deliveryStatus,
        String q,
        Instant openedFrom,
        Instant openedTo,
        Pageable pageable
    ) {
        Integer companyId = tenantSupport.requireCompanyId();
        String query = q == null || q.isBlank() ? null : q.trim();
        Page<FloorOrder> page = orderRepository.searchByChannel(
            companyId,
            storeId,
            channel,
            status,
            deliveryStatus,
            query,
            openedFrom,
            openedTo,
            pageable
        );
        if (page.isEmpty()) {
            return page.map(order -> assembler.toBoardCard(order, List.of()));
        }
        List<UUID> orderIds = page.getContent().stream().map(FloorOrder::getId).toList();
        Map<UUID, List<FloorOrderItem>> itemsByOrder = itemRepository.findByOrderIdInOrdered(orderIds).stream()
            .collect(Collectors.groupingBy(item -> item.getOrder().getId()));
        return page.map(order -> assembler.toBoardCard(
            order,
            itemsByOrder.getOrDefault(order.getId(), Collections.emptyList())
        ));
    }

    @Override
    public OrderResponse get(UUID orderId) {
        var order = orderLookup.require(orderId);
        return assembler.toResponse(
            order,
            itemRepository.findByOrderIdOrderBySortOrderAscCreatedAtAsc(orderId),
            linkedTables.allTables(order)
        );
    }

    @Override
    @Transactional
    public OrderResponse updateGuests(UUID orderId, UpdateGuestsRequest request) {
        return updateGuestsHandler.handle(orderId, request);
    }

    @Override
    @Transactional
    public OrderResponse updateDeliveryDetails(UUID orderId, UpdateDeliveryDetailsRequest request) {
        return updateDeliveryDetailsHandler.handle(orderId, request);
    }

    @Override
    @Transactional
    public OrderResponse updateDeliveryStatus(UUID orderId, UpdateDeliveryStatusRequest request) {
        return updateDeliveryStatusHandler.handle(orderId, request);
    }

    @Override
    @Transactional
    public OrderResponse updateDiscount(UUID orderId, UpdateOrderDiscountRequest request) {
        return updateDiscountHandler.handle(orderId, request);
    }

    @Override
    @Transactional
    public OrderResponse assignWaiter(UUID orderId, AssignWaiterRequest request) {
        return assignWaiterHandler.handle(orderId, request);
    }

    @Override
    @Transactional
    public OrderResponse transferTable(UUID orderId, TransferTableRequest request) {
        return transferTableHandler.handle(orderId, request);
    }

    @Override
    @Transactional
    public OrderResponse mergeTables(UUID orderId, MergeTablesRequest request) {
        return mergeTablesHandler.handle(orderId, request);
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
