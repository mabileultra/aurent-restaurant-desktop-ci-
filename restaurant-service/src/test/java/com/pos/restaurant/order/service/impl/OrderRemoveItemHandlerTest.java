package com.pos.restaurant.order.service.impl;

import com.pos.restaurant.floor.support.FloorTenantSupport;
import com.pos.restaurant.kitchen.repository.KitchenTicketLineRepository;
import com.pos.restaurant.kitchen.repository.KitchenTicketRepository;
import com.pos.restaurant.order.domain.OrderItemStatus;
import com.pos.restaurant.order.domain.OrderStatus;
import com.pos.restaurant.order.dto.OrderResponse;
import com.pos.restaurant.order.entity.FloorOrder;
import com.pos.restaurant.order.entity.FloorOrderItem;
import com.pos.restaurant.order.repository.FloorOrderItemRepository;
import com.pos.restaurant.order.support.OrderItemMutabilityPolicy;
import com.pos.restaurant.order.support.OrderLookup;
import com.pos.restaurant.order.support.OrderResponseAssembler;
import com.pos.restaurant.print.service.PrintJobPublisher;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class OrderRemoveItemHandlerTest {

    @Mock private FloorOrderItemRepository itemRepository;
    @Mock private KitchenTicketLineRepository ticketLineRepository;
    @Mock private KitchenTicketRepository ticketRepository;
    @Mock private OrderLookup orderLookup;
    @Mock private OrderItemMutabilityPolicy mutabilityPolicy;
    @Mock private OrderResponseAssembler assembler;
    @Mock private FloorTenantSupport tenantSupport;
    @Mock private PrintJobPublisher printJobPublisher;

    @InjectMocks
    private OrderRemoveItemHandler handler;

    @Test
    void kitchenRefuse_printsVoidBeforeMarkingCancelled() {
        UUID orderId = UUID.randomUUID();
        UUID itemId = UUID.randomUUID();
        FloorOrder order = FloorOrder.builder().id(orderId).companyId(1).storeId(2).status(OrderStatus.OPEN).build();
        FloorOrderItem item = FloorOrderItem.builder()
            .id(itemId)
            .order(order)
            .name("BEFSHTEKIS")
            .quantity(BigDecimal.ONE)
            .sentQuantity(BigDecimal.ONE)
            .unitPrice(BigDecimal.TEN)
            .taxRate(BigDecimal.ZERO)
            .itemStatus(OrderItemStatus.SENT_TO_KITCHEN)
            .build();

        when(orderLookup.requireActive(orderId)).thenReturn(order);
        when(itemRepository.findByIdAndOrderId(itemId, orderId)).thenReturn(Optional.of(item));
        when(tenantSupport.canCancelOrdersWithItems()).thenReturn(true);
        when(ticketLineRepository.findByOrderItemId(itemId)).thenReturn(List.of());
        when(itemRepository.findByOrderIdOrderBySortOrderAscCreatedAtAsc(orderId)).thenReturn(List.of(item));
        when(assembler.toResponse(eq(order), any())).thenReturn(dummyResponse());

        handler.handle(orderId, itemId);

        verify(printJobPublisher).voidSlipsForItems(order, List.of(item));
        org.junit.jupiter.api.Assertions.assertEquals(OrderItemStatus.CANCELLED, item.getItemStatus());
    }

    @Test
    void newItemDelete_doesNotPrintVoid() {
        UUID orderId = UUID.randomUUID();
        UUID itemId = UUID.randomUUID();
        FloorOrder order = FloorOrder.builder().id(orderId).companyId(1).storeId(2).status(OrderStatus.OPEN).build();
        FloorOrderItem item = FloorOrderItem.builder()
            .id(itemId)
            .order(order)
            .name("Tea")
            .quantity(BigDecimal.ONE)
            .itemStatus(OrderItemStatus.NEW)
            .build();

        when(orderLookup.requireActive(orderId)).thenReturn(order);
        when(itemRepository.findByIdAndOrderId(itemId, orderId)).thenReturn(Optional.of(item));
        when(itemRepository.findByOrderIdOrderBySortOrderAscCreatedAtAsc(orderId)).thenReturn(List.of());
        when(assembler.toResponse(eq(order), any())).thenReturn(dummyResponse());

        handler.handle(orderId, itemId);

        verify(printJobPublisher, never()).voidSlipsForItems(any(), any());
        verify(printJobPublisher, never()).voidSlipsForItems(any(), any(), any());
        verify(itemRepository).delete(item);
    }

    private static OrderResponse dummyResponse() {
        return new OrderResponse(
            UUID.randomUUID(), 1, null, null, null, 2, OrderStatus.OPEN, null,
            1, 1, 0, null, null, null, null, null, null, null, null, null,
            BigDecimal.ZERO, null, null, null, BigDecimal.ZERO, null, null, 0,
            List.of(), List.of(), List.of()
        );
    }
}
