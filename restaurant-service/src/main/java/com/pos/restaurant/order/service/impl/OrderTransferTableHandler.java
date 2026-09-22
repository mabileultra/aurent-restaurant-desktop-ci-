package com.pos.restaurant.order.service.impl;

import com.pos.restaurant.exception.BusinessException;
import com.pos.restaurant.floor.domain.TableStatus;
import com.pos.restaurant.floor.entity.FloorTable;
import com.pos.restaurant.floor.support.FloorEntityLookup;
import com.pos.restaurant.order.domain.OrderStatus;
import com.pos.restaurant.order.dto.OrderResponse;
import com.pos.restaurant.order.dto.TransferTableRequest;
import com.pos.restaurant.order.entity.FloorOrder;
import com.pos.restaurant.order.repository.FloorOrderItemRepository;
import com.pos.restaurant.order.repository.FloorOrderRepository;
import com.pos.restaurant.order.repository.FloorOrderTableLinkRepository;
import com.pos.restaurant.order.support.OrderLinkedTablesSupport;
import com.pos.restaurant.order.support.OrderLookup;
import com.pos.restaurant.order.support.OrderResponseAssembler;
import com.pos.shared.log.LogUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.util.EnumSet;
import java.util.List;
import java.util.Set;
import java.util.UUID;

@Component
@RequiredArgsConstructor
public class OrderTransferTableHandler {

    private static final Set<TableStatus> TARGET_OK = EnumSet.of(
        TableStatus.FREE,
        TableStatus.CLEANING
    );

    private final OrderLookup orderLookup;
    private final FloorEntityLookup entityLookup;
    private final FloorOrderRepository orderRepository;
    private final FloorOrderItemRepository itemRepository;
    private final FloorOrderTableLinkRepository linkRepository;
    private final OrderLinkedTablesSupport linkedTables;
    private final OrderResponseAssembler assembler;

    @Transactional
    public OrderResponse handle(UUID orderId, TransferTableRequest request) {
        FloorOrder order = orderLookup.requireActive(orderId);
        if (order.getTable() == null) {
            throw new BusinessException("Order has no table");
        }
        FloorTable source = order.getTable();
        FloorTable target = entityLookup.requireTable(request.targetTableId());
        if (!source.getStoreId().equals(target.getStoreId())) {
            throw new BusinessException("Target table is in another store");
        }
        if (source.getId().equals(target.getId())) {
            throw new BusinessException("Table is already assigned");
        }
        if (linkRepository.findByTableId(target.getId()).isPresent()) {
            throw new BusinessException("Target table is linked to another order");
        }
        if (!TARGET_OK.contains(target.getStatus())) {
            throw new BusinessException("Target table is not free");
        }
        if (orderRepository.existsByTableIdAndStatusIn(
            target.getId(),
            List.of(OrderStatus.OPEN, OrderStatus.BILLING)
        )) {
            throw new BusinessException("Target table already has an open order");
        }

        TableStatus occupiedStatus = order.getStatus() == OrderStatus.BILLING
            ? TableStatus.WAITING_PAYMENT
            : TableStatus.OCCUPIED;

        source.setStatus(TableStatus.FREE);
        order.setTable(target);
        target.setStatus(occupiedStatus);

        LogUtil.info(OrderTransferTableHandler.class,
            "Order transferred: orderId={}, fromTable={}, toTable={}",
            orderId, source.getId(), target.getId());

        return assembler.toResponse(
            order,
            itemRepository.findByOrderIdOrderBySortOrderAscCreatedAtAsc(orderId),
            linkedTables.allTables(order)
        );
    }
}
