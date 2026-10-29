package com.pos.restaurant.revenue.service.impl;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.pos.restaurant.order.entity.FloorOrder;
import com.pos.restaurant.order.support.OrderTotals;
import com.pos.restaurant.payment.domain.PaymentMethod;
import com.pos.restaurant.payment.entity.FloorOrderPayment;
import com.pos.restaurant.revenue.entity.RevenueOutbox;
import com.pos.restaurant.revenue.service.RevenueOutboxDispatchService;
import com.pos.restaurant.revenue.service.RevenueOutboxService;
import com.pos.restaurant.revenue.support.RestaurantSaleCompletedFactory;
import com.pos.shared.event.SaleCompletedEvent;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class RevenuePublicationDispatchTest {

    @Mock
    private RevenueOutboxService outboxService;
    @Mock
    private RevenueOutboxDispatchService outboxDispatchService;
    @Mock
    private RestaurantSaleCompletedFactory saleCompletedFactory;
    @Mock
    private OrderTotals orderTotals;
    @Mock
    private ObjectMapper objectMapper;

    @InjectMocks
    private RevenuePublicationServiceImpl publicationService;

    @Test
    void publishPaidOrderDispatchesAfterCommitNotSyncTrySend() throws Exception {
        UUID orderId = UUID.randomUUID();
        UUID saleOutboxId = UUID.randomUUID();
        UUID financeOutboxId = UUID.randomUUID();
        FloorOrder order = FloorOrder.builder().id(orderId).companyId(1).storeId(2).orderNo(9).build();
        FloorOrderPayment payment = FloorOrderPayment.builder()
            .id(UUID.randomUUID())
            .order(order)
            .method(PaymentMethod.CASH)
            .amount(BigDecimal.TEN)
            .paidByUserId(UUID.randomUUID())
            .paidAt(Instant.parse("2026-10-30T00:00:00Z"))
            .build();

        when(saleCompletedFactory.fromPaidOrder(eq(order), any(), eq(payment)))
            .thenReturn(org.mockito.Mockito.mock(SaleCompletedEvent.class));
        when(orderTotals.billable(any())).thenReturn(BigDecimal.TEN);
        when(objectMapper.writeValueAsString(any())).thenReturn("{}");
        when(outboxService.enqueue(any(), anyString(), anyString(), anyString(), anyString()))
            .thenReturn(RevenueOutbox.builder().id(saleOutboxId).build())
            .thenReturn(RevenueOutbox.builder().id(financeOutboxId).build());

        publicationService.publishPaidOrder(order, List.of(), payment);

        ArgumentCaptor<UUID> ids = ArgumentCaptor.forClass(UUID.class);
        verify(outboxDispatchService, times(2)).dispatchAfterCommit(ids.capture());
        assertThat(ids.getAllValues()).containsExactly(saleOutboxId, financeOutboxId);
        verify(outboxService, never()).trySend(any());
    }
}
