package com.pos.restaurant.order.service.impl;

import com.pos.restaurant.exception.ForbiddenException;
import com.pos.restaurant.exception.NotFoundException;
import com.pos.restaurant.floor.support.FloorTenantSupport;
import com.pos.restaurant.kitchen.domain.KitchenTicketStatus;
import com.pos.restaurant.kitchen.entity.KitchenTicketLine;
import com.pos.restaurant.kitchen.repository.KitchenTicketLineRepository;
import com.pos.restaurant.kitchen.repository.KitchenTicketRepository;
import com.pos.restaurant.order.domain.OrderItemStatus;
import com.pos.restaurant.order.dto.OrderResponse;
import com.pos.restaurant.order.entity.FloorOrder;
import com.pos.restaurant.order.entity.FloorOrderItem;
import com.pos.restaurant.order.repository.FloorOrderItemRepository;
import com.pos.restaurant.order.support.OrderItemMutabilityPolicy;
import com.pos.restaurant.order.support.OrderLookup;
import com.pos.restaurant.order.support.OrderResponseAssembler;
import com.pos.restaurant.print.service.PrintJobPublisher;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Component
@RequiredArgsConstructor
public class OrderRemoveItemHandler {

    private final FloorOrderItemRepository itemRepository;
    private final KitchenTicketLineRepository ticketLineRepository;
    private final KitchenTicketRepository ticketRepository;
    private final OrderLookup orderLookup;
    private final OrderItemMutabilityPolicy mutabilityPolicy;
    private final OrderResponseAssembler assembler;
    private final FloorTenantSupport tenantSupport;
    private final PrintJobPublisher printJobPublisher;

    @Transactional
    public OrderResponse handle(UUID orderId, UUID itemId) {
        FloorOrder order = orderLookup.requireActive(orderId);
        FloorOrderItem item = itemRepository.findByIdAndOrderId(itemId, orderId)
            .orElseThrow(() -> new NotFoundException("Order item not found: " + itemId));

        if (item.getItemStatus() == OrderItemStatus.NEW) {
            mutabilityPolicy.assertMutable(item);
            itemRepository.delete(item);
            return assembler.toResponse(order, itemRepository.findByOrderIdOrderBySortOrderAscCreatedAtAsc(orderId));
        }

        if (item.getItemStatus() == OrderItemStatus.CANCELLED) {
            return assembler.toResponse(order, itemRepository.findByOrderIdOrderBySortOrderAscCreatedAtAsc(orderId));
        }

        // Kitchen-sent refuse: cashier/manager only + void slip to section printer.
        if (!tenantSupport.canCancelOrdersWithItems()) {
            throw new ForbiddenException("Only a manager or cashier can refuse a kitchen item");
        }
        printJobPublisher.voidSlipsForItems(order, List.of(item));
        item.setItemStatus(OrderItemStatus.CANCELLED);
        for (KitchenTicketLine ticketLine : ticketLineRepository.findByOrderItemId(itemId)) {
            var ticket = ticketLine.getTicket();
            if (ticket != null
                && ticket.getStatus() != KitchenTicketStatus.SERVED
                && ticket.getStatus() != KitchenTicketStatus.CANCELLED) {
                boolean anyActive = ticketLineRepository.findByTicketId(ticket.getId()).stream()
                    .anyMatch(row -> row.getOrderItem() != null
                        && row.getOrderItem().getItemStatus() != OrderItemStatus.CANCELLED
                        && !row.getOrderItem().getId().equals(itemId));
                if (!anyActive) {
                    ticket.setStatus(KitchenTicketStatus.CANCELLED);
                    ticketRepository.save(ticket);
                }
            }
        }
        return assembler.toResponse(order, itemRepository.findByOrderIdOrderBySortOrderAscCreatedAtAsc(orderId));
    }
}
