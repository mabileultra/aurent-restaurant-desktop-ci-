package com.pos.restaurant.payment.service.impl;

import com.pos.restaurant.booking.service.impl.FloorReservationServiceImpl;
import com.pos.restaurant.floor.revision.FloorRevisionBump;
import com.pos.restaurant.kitchen.service.impl.KitchenTicketServiceImpl;
import com.pos.restaurant.order.domain.OrderStatus;
import com.pos.restaurant.order.dto.OrderResponse;
import com.pos.restaurant.payment.dto.PartialRefundRequest;
import com.pos.restaurant.security.RestaurantTenantContext;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.lang.reflect.Field;
import java.math.BigDecimal;
import java.util.Arrays;
import java.util.List;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class PaymentFloorRevisionTest {

    @Mock
    private RequestBillHandler requestBillHandler;
    @Mock
    private PayOrderHandler payOrderHandler;
    @Mock
    private PaidOrderRefundHandler paidOrderRefundHandler;
    @Mock
    private PaidOrderPartialRefundHandler paidOrderPartialRefundHandler;
    @Mock
    private ListRecentPaidOrdersHandler listRecentPaidOrdersHandler;
    @Mock
    private GetOrderPaymentHandler getOrderPaymentHandler;
    @Mock
    private FloorRevisionBump floorRevision;

    @InjectMocks
    private PaymentServiceImpl service;

    @AfterEach
    void clearTenant() {
        RestaurantTenantContext.clear();
    }

    @Test
    void partialRefundThatStaysClosedDoesNotBump() {
        RestaurantTenantContext.set(4, null, null);
        UUID orderId = UUID.randomUUID();
        PartialRefundRequest request = new PartialRefundRequest("part", List.of());
        when(paidOrderPartialRefundHandler.handle(orderId, request))
            .thenReturn(order(OrderStatus.CLOSED, 12));

        service.refundItems(orderId, request);

        verifyNoInteractions(floorRevision);
    }

    @Test
    void fullRefundThatFreesTheTableBumpsOnce() {
        RestaurantTenantContext.set(4, null, null);
        UUID orderId = UUID.randomUUID();
        when(paidOrderRefundHandler.handle(orderId)).thenReturn(order(OrderStatus.REFUNDED, 12));

        service.refund(orderId);

        verify(floorRevision).bump(4, 2);
    }

    @Test
    void kitchenDoesNotOwnFloorRevisionAndBookingDoes() {
        assertThat(fieldTypes(KitchenTicketServiceImpl.class)).doesNotContain(FloorRevisionBump.class);
        assertThat(fieldTypes(FloorReservationServiceImpl.class)).contains(FloorRevisionBump.class);
    }

    private static List<Class<?>> fieldTypes(Class<?> type) {
        return Arrays.stream(type.getDeclaredFields()).map(Field::getType).toList();
    }

    private static OrderResponse order(OrderStatus status, Integer tableId) {
        return new OrderResponse(
            UUID.randomUUID(), 1, null, tableId, null, 2, status, null,
            1, 1, 0, null, null, null, null, null, null, null, null, null,
            BigDecimal.ZERO, null, null, null, BigDecimal.ZERO, null, null, 0,
            List.of(), List.of(), List.of(), null
        );
    }
}
