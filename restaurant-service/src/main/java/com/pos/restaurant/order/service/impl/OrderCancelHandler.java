package com.pos.restaurant.order.service.impl;

import com.pos.restaurant.exception.ForbiddenException;
import com.pos.restaurant.floor.domain.TableStatus;
import com.pos.restaurant.floor.support.FloorTenantSupport;
import com.pos.restaurant.kitchen.domain.KitchenTicketStatus;
import com.pos.restaurant.kitchen.entity.KitchenTicket;
import com.pos.restaurant.kitchen.repository.KitchenTicketLineRepository;
import com.pos.restaurant.kitchen.repository.KitchenTicketRepository;
import com.pos.restaurant.order.domain.OrderItemStatus;
import com.pos.restaurant.order.domain.OrderStatus;
import com.pos.restaurant.order.entity.FloorOrder;
import com.pos.restaurant.order.repository.FloorOrderItemRepository;
import com.pos.restaurant.order.support.OrderLinkedTablesSupport;
import com.pos.restaurant.order.support.TableSeatSync;
import com.pos.restaurant.order.support.OrderLookup;
import com.pos.shared.log.LogUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.UUID;

@Component
@RequiredArgsConstructor
public class OrderCancelHandler {

    private final FloorOrderItemRepository itemRepository;
    private final KitchenTicketRepository ticketRepository;
    private final KitchenTicketLineRepository ticketLineRepository;
    private final OrderLookup orderLookup;
    private final FloorTenantSupport tenantSupport;
    private final OrderLinkedTablesSupport linkedTables;
    private final TableSeatSync tableSeatSync;

    @Transactional
    public void handle(UUID orderId) {
        FloorOrder order = orderLookup.requireActive(orderId);
        int lines = itemRepository.countByOrderId(orderId);
        if (lines > 0 && !tenantSupport.isManager()) {
            throw new ForbiddenException("Only a manager can cancel an order with items");
        }
        order.setStatus(OrderStatus.CANCELLED);
        order.setClosedAt(Instant.now());
        var seated = linkedTables.allTables(order);
        linkedTables.clearLinks(orderId);
        tableSeatSync.refresh(seated, TableStatus.FREE);
        for (KitchenTicket ticket : ticketRepository.findByOrderId(orderId)) {
            if (ticket.getStatus() == KitchenTicketStatus.SERVED || ticket.getStatus() == KitchenTicketStatus.CANCELLED) {
                continue;
            }
            ticket.setStatus(KitchenTicketStatus.CANCELLED);
            for (var line : ticketLineRepository.findByTicketId(ticket.getId())) {
                line.getOrderItem().setItemStatus(OrderItemStatus.CANCELLED);
            }
        }
        LogUtil.info(OrderCancelHandler.class, "Order cancelled: id={}", orderId);
    }
}
