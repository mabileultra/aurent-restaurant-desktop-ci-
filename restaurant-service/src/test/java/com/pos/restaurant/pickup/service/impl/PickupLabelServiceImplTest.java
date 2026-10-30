package com.pos.restaurant.pickup.service.impl;

import com.pos.restaurant.exception.BusinessException;
import com.pos.restaurant.order.domain.OrderChannel;
import com.pos.restaurant.order.domain.OrderItemStatus;
import com.pos.restaurant.order.entity.FloorOrder;
import com.pos.restaurant.order.entity.FloorOrderItem;
import com.pos.restaurant.order.repository.FloorOrderItemRepository;
import com.pos.restaurant.order.support.OrderLookup;
import com.pos.restaurant.order.support.OrderResponseAssembler;
import com.pos.restaurant.pickup.support.PickupLabelPolicy;
import com.pos.restaurant.pickup.support.PickupNumberIssuer;
import com.pos.restaurant.print.service.PrintJobPublisher;
import com.pos.restaurant.security.RestaurantTenantContext;
import com.pos.restaurant.shift.entity.RestaurantShift;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.Spy;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyList;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class PickupLabelServiceImplTest {

    @Spy private PickupLabelPolicy policy = new PickupLabelPolicy();
    @Mock private PickupNumberIssuer numberIssuer;
    @Mock private PrintJobPublisher printJobPublisher;
    @Mock private OrderLookup orderLookup;
    @Mock private FloorOrderItemRepository itemRepository;
    @Mock private OrderResponseAssembler assembler;
    @InjectMocks private PickupLabelServiceImpl service;

    @BeforeEach
    void grant() {
        RestaurantTenantContext.set(1, UUID.randomUUID(), "CASHIER", false, true);
    }

    @AfterEach
    void clear() {
        RestaurantTenantContext.clear();
    }

    @Test
    void firstSendAssignsAndEnqueues() {
        FloorOrder order = takeaway();
        FloorOrderItem item = item(order);
        when(numberIssuer.assignOnce(order)).thenAnswer(inv -> {
            order.setPickupNo(1);
            return 1;
        });

        service.assignAndEnqueue(order, List.of(item));

        verify(numberIssuer).assignOnce(order);
        verify(printJobPublisher).pickupLabel(order, List.of(item));
    }

    @Test
    void secondSendKeepsNumberAndDoesNotPrintAgain() {
        FloorOrder order = takeaway();
        order.setPickupNo(7);

        service.assignAndEnqueue(order, List.of(item(order)));

        verify(numberIssuer, never()).assignOnce(any());
        verify(printJobPublisher, never()).pickupLabel(any(), anyList());
    }

    @Test
    void dineInAssignsOnFirstSend() {
        FloorOrder order = FloorOrder.builder()
            .id(UUID.randomUUID())
            .channel(OrderChannel.DINE_IN)
            .shift(RestaurantShift.builder().id(UUID.randomUUID()).build())
            .build();
        FloorOrderItem line = item(order);
        when(numberIssuer.assignOnce(order)).thenAnswer(inv -> {
            order.setPickupNo(3);
            return 3;
        });

        service.assignAndEnqueue(order, List.of(line));

        verify(printJobPublisher).pickupLabel(order, List.of(line));
    }

    @Test
    void reprintWithoutModuleFails() {
        RestaurantTenantContext.clear();
        assertThrows(BusinessException.class, () -> service.reprint(UUID.randomUUID()));
    }

    private static FloorOrder takeaway() {
        return FloorOrder.builder()
            .id(UUID.randomUUID())
            .channel(OrderChannel.TAKEAWAY)
            .shift(RestaurantShift.builder().id(UUID.randomUUID()).build())
            .build();
    }

    private static FloorOrderItem item(FloorOrder order) {
        return FloorOrderItem.builder()
            .id(UUID.randomUUID())
            .order(order)
            .name("Latte")
            .quantity(BigDecimal.ONE)
            .itemStatus(OrderItemStatus.SENT_TO_KITCHEN)
            .build();
    }
}
