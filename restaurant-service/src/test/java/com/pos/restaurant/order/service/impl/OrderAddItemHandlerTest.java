package com.pos.restaurant.order.service.impl;

import com.pos.restaurant.floor.support.FloorTenantSupport;
import com.pos.restaurant.menu.entity.MenuItem;
import com.pos.restaurant.menu.repository.MenuCategoryRepository;
import com.pos.restaurant.menu.repository.MenuItemRepository;
import com.pos.restaurant.modifier.repository.MenuItemModifierLinkRepository;
import com.pos.restaurant.modifier.repository.ModifierGroupRepository;
import com.pos.restaurant.modifier.repository.ModifierOptionRepository;
import com.pos.restaurant.modifier.support.ModifierSelectionPolicy;
import com.pos.restaurant.order.domain.OrderItemStatus;
import com.pos.restaurant.order.domain.OrderStatus;
import com.pos.restaurant.order.dto.AddOrderItemRequest;
import com.pos.restaurant.order.dto.OrderResponse;
import com.pos.restaurant.order.entity.FloorOrder;
import com.pos.restaurant.order.entity.FloorOrderItem;
import com.pos.restaurant.order.repository.FloorOrderItemModifierRepository;
import com.pos.restaurant.order.repository.FloorOrderItemRepository;
import com.pos.restaurant.order.support.OrderLinkedTablesSupport;
import com.pos.restaurant.order.support.OrderLookup;
import com.pos.restaurant.order.support.OrderResponseAssembler;
import com.pos.restaurant.order.support.ServiceChargeSupport;
import com.pos.restaurant.order.support.TableSeatSync;
import com.pos.restaurant.print.service.PrintJobPublisher;
import com.pos.restaurant.settings.service.KitchenBoardService;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class OrderAddItemHandlerTest {

    @Mock private FloorOrderItemRepository itemRepository;
    @Mock private FloorOrderItemModifierRepository itemModifierRepository;
    @Mock private MenuItemRepository menuItemRepository;
    @Mock private MenuCategoryRepository menuCategoryRepository;
    @Mock private MenuItemModifierLinkRepository linkRepository;
    @Mock private ModifierGroupRepository groupRepository;
    @Mock private ModifierOptionRepository optionRepository;
    @Mock private ModifierSelectionPolicy selectionPolicy;
    @Mock private OrderLookup orderLookup;
    @Mock private FloorTenantSupport tenantSupport;
    @Mock private OrderResponseAssembler assembler;
    @Mock private PrintJobPublisher printJobPublisher;
    @Mock private KitchenBoardService kitchenBoardService;
    @Mock private OrderLinkedTablesSupport linkedTables;
    @Mock private TableSeatSync tableSeatSync;
    @Mock private ServiceChargeSupport serviceChargeSupport;

    @InjectMocks
    private OrderAddItemHandler handler;

    @Test
    void mergesIntoKitchenLineWithoutCreatingNewRow() {
        UUID orderId = UUID.randomUUID();
        UUID menuId = UUID.randomUUID();
        FloorOrder order = FloorOrder.builder()
            .id(orderId)
            .companyId(1)
            .storeId(2)
            .orderNo(10)
            .status(OrderStatus.OPEN)
            .build();
        MenuItem menuItem = MenuItem.builder()
            .id(menuId)
            .companyId(1)
            .storeId(2)
            .name("BEHAMAD")
            .price(new BigDecimal("18000"))
            .active(true)
            .available(true)
            .build();
        FloorOrderItem kitchenLine = FloorOrderItem.builder()
            .id(UUID.randomUUID())
            .order(order)
            .menuItem(menuItem)
            .name("BEHAMAD")
            .quantity(BigDecimal.ONE)
            .sentQuantity(BigDecimal.ONE)
            .itemStatus(OrderItemStatus.SENT_TO_KITCHEN)
            .unitPrice(new BigDecimal("18000"))
            .build();

        when(orderLookup.requireActive(orderId)).thenReturn(order);
        when(tenantSupport.requireCompanyId()).thenReturn(1);
        when(menuItemRepository.findByIdAndCompanyId(menuId, 1)).thenReturn(Optional.of(menuItem));
        when(linkRepository.findByMenuItemId(menuId)).thenReturn(List.of());
        when(itemRepository.findFirstByOrderIdAndMenuItemIdAndNoteIsNullAndItemStatus(
            orderId, menuId, OrderItemStatus.NEW
        )).thenReturn(Optional.empty());
        when(itemRepository.findFirstByOrderIdAndMenuItemIdAndNoteIsNullAndItemStatusNotInOrderBySortOrderAscCreatedAtAsc(
            orderId, menuId, List.of(OrderItemStatus.NEW, OrderItemStatus.CANCELLED)
        )).thenReturn(Optional.of(kitchenLine));
        when(itemModifierRepository.findByOrderItemIdIn(List.of(kitchenLine.getId()))).thenReturn(List.of());
        when(itemRepository.findByOrderIdOrderBySortOrderAscCreatedAtAsc(orderId))
            .thenReturn(List.of(kitchenLine));
        when(assembler.toResponse(eq(order), any())).thenReturn(dummyResponse());
        when(kitchenBoardService.isEnabled(1, 2)).thenReturn(false);

        handler.handle(orderId, new AddOrderItemRequest(menuId, BigDecimal.ONE, null, null));

        assertEquals(0, kitchenLine.getQuantity().compareTo(new BigDecimal("2.000")));
        assertEquals(0, kitchenLine.getSentQuantity().compareTo(BigDecimal.ONE));
        assertEquals(OrderItemStatus.SENT_TO_KITCHEN, kitchenLine.getItemStatus());
        verify(itemRepository, never()).save(any(FloorOrderItem.class));
    }

    @Test
    void prefersNewLineMergeOverKitchen() {
        UUID orderId = UUID.randomUUID();
        UUID menuId = UUID.randomUUID();
        FloorOrder order = FloorOrder.builder()
            .id(orderId).companyId(1).storeId(2).orderNo(10).status(OrderStatus.OPEN).build();
        MenuItem menuItem = MenuItem.builder()
            .id(menuId).companyId(1).storeId(2).name("X")
            .price(BigDecimal.TEN).active(true).available(true).build();
        FloorOrderItem newLine = FloorOrderItem.builder()
            .id(UUID.randomUUID()).order(order).menuItem(menuItem).name("X")
            .quantity(BigDecimal.ONE).sentQuantity(BigDecimal.ZERO)
            .itemStatus(OrderItemStatus.NEW).unitPrice(BigDecimal.TEN).build();

        when(orderLookup.requireActive(orderId)).thenReturn(order);
        when(tenantSupport.requireCompanyId()).thenReturn(1);
        when(menuItemRepository.findByIdAndCompanyId(menuId, 1)).thenReturn(Optional.of(menuItem));
        when(linkRepository.findByMenuItemId(menuId)).thenReturn(List.of());
        when(itemRepository.findFirstByOrderIdAndMenuItemIdAndNoteIsNullAndItemStatus(
            orderId, menuId, OrderItemStatus.NEW
        )).thenReturn(Optional.of(newLine));
        when(itemModifierRepository.findByOrderItemIdIn(List.of(newLine.getId()))).thenReturn(List.of());
        when(itemRepository.findByOrderIdOrderBySortOrderAscCreatedAtAsc(orderId))
            .thenReturn(List.of(newLine));
        when(assembler.toResponse(eq(order), any())).thenReturn(dummyResponse());
        when(kitchenBoardService.isEnabled(1, 2)).thenReturn(false);

        handler.handle(orderId, new AddOrderItemRequest(menuId, null, null, null));

        assertEquals(0, newLine.getQuantity().compareTo(new BigDecimal("2.000")));
        verify(itemRepository, never())
            .findFirstByOrderIdAndMenuItemIdAndNoteIsNullAndItemStatusNotInOrderBySortOrderAscCreatedAtAsc(
                any(), any(), any()
            );
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
