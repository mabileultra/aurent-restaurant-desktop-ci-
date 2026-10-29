package com.pos.restaurant.order.support;

import com.pos.restaurant.exception.BusinessException;
import com.pos.restaurant.floor.support.FloorTenantSupport;
import com.pos.restaurant.order.domain.OrderChannel;
import com.pos.restaurant.order.domain.OrderStatus;
import com.pos.restaurant.order.entity.FloorOrder;
import com.pos.restaurant.order.repository.FloorOrderRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class OrderLookupPayableLockTest {

    @Mock
    private FloorOrderRepository orderRepository;
    @Mock
    private FloorTenantSupport tenantSupport;

    @InjectMocks
    private OrderLookup orderLookup;

    @Test
    void requirePayableForUpdateLocksAndAcceptsBilling() {
        UUID id = UUID.randomUUID();
        FloorOrder order = FloorOrder.builder()
            .id(id)
            .status(OrderStatus.BILLING)
            .channel(OrderChannel.DINE_IN)
            .build();
        when(tenantSupport.requireCompanyId()).thenReturn(1);
        when(orderRepository.findByIdAndCompanyIdForUpdate(id, 1)).thenReturn(Optional.of(order));

        assertThat(orderLookup.requirePayableForUpdate(id)).isSameAs(order);
        verify(orderRepository).findByIdAndCompanyIdForUpdate(id, 1);
    }

    @Test
    void requirePayableForUpdateRejectsAlreadyClosed() {
        UUID id = UUID.randomUUID();
        FloorOrder order = FloorOrder.builder()
            .id(id)
            .status(OrderStatus.CLOSED)
            .channel(OrderChannel.DINE_IN)
            .build();
        when(tenantSupport.requireCompanyId()).thenReturn(1);
        when(orderRepository.findByIdAndCompanyIdForUpdate(id, 1)).thenReturn(Optional.of(order));

        assertThatThrownBy(() -> orderLookup.requirePayableForUpdate(id))
            .isInstanceOf(BusinessException.class)
            .hasMessageContaining("Bill has not been requested");
    }
}
