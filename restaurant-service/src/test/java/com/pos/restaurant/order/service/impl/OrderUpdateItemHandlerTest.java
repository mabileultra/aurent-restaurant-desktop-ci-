package com.pos.restaurant.order.service.impl;

import com.pos.restaurant.exception.ForbiddenException;
import com.pos.restaurant.floor.support.FloorTenantSupport;
import com.pos.restaurant.order.domain.OrderItemStatus;
import com.pos.restaurant.order.domain.OrderStatus;
import com.pos.restaurant.order.dto.OrderResponse;
import com.pos.restaurant.order.dto.UpdateOrderItemRequest;
import com.pos.restaurant.order.entity.FloorOrder;
import com.pos.restaurant.order.entity.FloorOrderItem;
import com.pos.restaurant.order.repository.FloorOrderItemRepository;
import com.pos.restaurant.order.support.OrderItemMutabilityPolicy;
import com.pos.restaurant.order.support.OrderLookup;
import com.pos.restaurant.order.support.OrderResponseAssembler;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class OrderUpdateItemHandlerTest {

    @Mock private FloorOrderItemRepository itemRepository;
    @Mock private OrderLookup orderLookup;
    @Mock private OrderItemMutabilityPolicy mutabilityPolicy;
    @Mock private OrderResponseAssembler assembler;
    @Mock private FloorTenantSupport tenantSupport;

    @InjectMocks
    private OrderUpdateItemHandler handler;

    @Test
    void kitchenQtyCutCreatesCancelledSiblingForJournal() {
        UUID orderId = UUID.randomUUID();
        UUID itemId = UUID.randomUUID();
        FloorOrder order = FloorOrder.builder()
            .id(orderId)
            .companyId(1)
            .storeId(2)
            .status(OrderStatus.OPEN)
            .build();
        FloorOrderItem item = FloorOrderItem.builder()
            .id(itemId)
            .order(order)
            .name("Salat")
            .quantity(new BigDecimal("2"))
            .sentQuantity(new BigDecimal("2"))
            .unitPrice(new BigDecimal("25000"))
            .taxRate(BigDecimal.ZERO)
            .itemStatus(OrderItemStatus.SENT_TO_KITCHEN)
            .sortOrder(1)
            .build();

        when(orderLookup.requireActive(orderId)).thenReturn(order);
        when(itemRepository.findByIdAndOrderId(itemId, orderId)).thenReturn(Optional.of(item));
        when(tenantSupport.canCancelOrdersWithItems()).thenReturn(true);
        when(itemRepository.findByOrderIdOrderBySortOrderAscCreatedAtAsc(orderId)).thenReturn(List.of(item));
        when(assembler.toResponse(eq(order), any())).thenReturn(dummyResponse());

        handler.handle(orderId, itemId, new UpdateOrderItemRequest(BigDecimal.ONE, null));

        assertEquals(0, item.getQuantity().compareTo(BigDecimal.ONE));
        assertEquals(0, item.getSentQuantity().compareTo(BigDecimal.ONE));

        ArgumentCaptor<FloorOrderItem> refuseCap = ArgumentCaptor.forClass(FloorOrderItem.class);
        verify(itemRepository).save(refuseCap.capture());
        FloorOrderItem refused = refuseCap.getValue();
        assertEquals(OrderItemStatus.CANCELLED, refused.getItemStatus());
        assertEquals(0, refused.getQuantity().compareTo(BigDecimal.ONE));
        assertEquals("Salat", refused.getName());
        assertEquals(0, refused.getUnitPrice().compareTo(new BigDecimal("25000")));
    }

    @Test
    void waiterCannotCutBelowSentKitchenQty() {
        UUID orderId = UUID.randomUUID();
        UUID itemId = UUID.randomUUID();
        FloorOrder order = FloorOrder.builder().id(orderId).status(OrderStatus.OPEN).build();
        FloorOrderItem item = FloorOrderItem.builder()
            .id(itemId)
            .order(order)
            .name("Salat")
            .quantity(new BigDecimal("2"))
            .sentQuantity(new BigDecimal("2"))
            .itemStatus(OrderItemStatus.SENT_TO_KITCHEN)
            .build();

        when(orderLookup.requireActive(orderId)).thenReturn(order);
        when(itemRepository.findByIdAndOrderId(itemId, orderId)).thenReturn(Optional.of(item));
        when(tenantSupport.canCancelOrdersWithItems()).thenReturn(false);

        assertThrows(
            ForbiddenException.class,
            () -> handler.handle(orderId, itemId, new UpdateOrderItemRequest(BigDecimal.ONE, null))
        );
        verify(itemRepository, never()).save(any());
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
