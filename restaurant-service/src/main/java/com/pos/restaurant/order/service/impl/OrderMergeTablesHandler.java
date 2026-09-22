package com.pos.restaurant.order.service.impl;

import com.pos.restaurant.exception.BusinessException;
import com.pos.restaurant.floor.domain.TableStatus;
import com.pos.restaurant.floor.entity.FloorTable;
import com.pos.restaurant.floor.support.FloorEntityLookup;
import com.pos.restaurant.floor.support.FloorTenantSupport;
import com.pos.restaurant.order.domain.OrderStatus;
import com.pos.restaurant.order.dto.MergeTablesRequest;
import com.pos.restaurant.order.dto.OrderResponse;
import com.pos.restaurant.order.entity.FloorOrder;
import com.pos.restaurant.order.entity.FloorOrderItem;
import com.pos.restaurant.order.entity.FloorOrderMerge;
import com.pos.restaurant.order.repository.FloorOrderItemRepository;
import com.pos.restaurant.order.repository.FloorOrderMergeRepository;
import com.pos.restaurant.order.repository.FloorOrderRepository;
import com.pos.restaurant.order.repository.FloorOrderTableLinkRepository;
import com.pos.restaurant.order.support.OrderLinkedTablesSupport;
import com.pos.restaurant.order.support.OrderLookup;
import com.pos.restaurant.order.support.OrderResponseAssembler;
import com.pos.shared.log.LogUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

@Component
@RequiredArgsConstructor
public class OrderMergeTablesHandler {

    private final OrderLookup orderLookup;
    private final FloorEntityLookup entityLookup;
    private final FloorOrderRepository orderRepository;
    private final FloorOrderItemRepository itemRepository;
    private final FloorOrderMergeRepository mergeRepository;
    private final FloorOrderTableLinkRepository linkRepository;
    private final OrderLinkedTablesSupport linkedTables;
    private final FloorTenantSupport tenantSupport;
    private final OrderResponseAssembler assembler;

    @Transactional
    public OrderResponse handle(UUID primaryOrderId, MergeTablesRequest request) {
        FloorOrder primary = orderLookup.requireOpen(primaryOrderId);
        if (primary.getTable() == null) {
            throw new BusinessException("Primary order has no table");
        }
        FloorTable secondaryTable = entityLookup.requireTable(request.secondaryTableId());
        if (!primary.getStoreId().equals(secondaryTable.getStoreId())) {
            throw new BusinessException("Secondary table is in another store");
        }
        if (primary.getTable().getId().equals(secondaryTable.getId())) {
            throw new BusinessException("Cannot merge a table with itself");
        }
        if (linkRepository.findByTableId(secondaryTable.getId()).isPresent()) {
            throw new BusinessException("Secondary table is already linked");
        }

        FloorOrder secondary = orderRepository
            .findTableOrdersByCompanyIdAndStoreIdAndStatusIn(
                primary.getCompanyId(),
                primary.getStoreId(),
                List.of(OrderStatus.OPEN, OrderStatus.BILLING)
            )
            .stream()
            .filter(order -> order.getTable() != null
                && order.getTable().getId().equals(secondaryTable.getId()))
            .findFirst()
            .orElseThrow(() -> new BusinessException("Secondary table has no open order"));

        if (secondary.getStatus() == OrderStatus.BILLING) {
            throw new BusinessException("Cannot merge a table waiting for payment");
        }
        if (secondary.getId().equals(primary.getId())) {
            throw new BusinessException("Orders are already the same");
        }

        List<FloorOrderItem> primaryItems = itemRepository
            .findByOrderIdOrderBySortOrderAscCreatedAtAsc(primary.getId());
        int sortBase = primaryItems.stream()
            .mapToInt(FloorOrderItem::getSortOrder)
            .max()
            .orElse(0);

        List<FloorOrderItem> secondaryItems = itemRepository
            .findByOrderIdOrderBySortOrderAscCreatedAtAsc(secondary.getId());
        int offset = 1;
        for (FloorOrderItem item : secondaryItems) {
            item.setOrder(primary);
            item.setSortOrder(sortBase + offset);
            offset += 1;
        }

        secondary.setStatus(OrderStatus.CANCELLED);
        secondary.setClosedAt(Instant.now());
        secondary.setTable(null);

        UUID actor = tenantSupport.requireUserId();
        linkedTables.linkTable(primary, secondaryTable, actor);
        secondaryTable.setStatus(TableStatus.OCCUPIED);

        mergeRepository.save(FloorOrderMerge.builder()
            .primaryOrderId(primary.getId())
            .secondaryOrderId(secondary.getId())
            .primaryTableId(primary.getTable().getId())
            .secondaryTableId(secondaryTable.getId())
            .mergedByUserId(actor)
            .build());

        primary.setGuestCount(primary.getGuestCount() + secondary.getGuestCount());
        primary.setAdultCount(primary.getAdultCount() + secondary.getAdultCount());
        primary.setChildrenCount(primary.getChildrenCount() + secondary.getChildrenCount());

        LogUtil.info(OrderMergeTablesHandler.class,
            "Tables merged: primaryOrder={}, secondaryOrder={}, secondaryTable={}",
            primary.getId(), secondary.getId(), secondaryTable.getId());

        return assembler.toResponse(
            primary,
            itemRepository.findByOrderIdOrderBySortOrderAscCreatedAtAsc(primary.getId()),
            linkedTables.allTables(primary)
        );
    }
}
