package com.pos.restaurant.order.support;

import com.pos.restaurant.exception.ForbiddenException;
import com.pos.restaurant.floor.support.FloorTenantSupport;
import com.pos.restaurant.order.entity.FloorOrder;
import com.pos.restaurant.settings.service.ForeignTableOrderService;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertDoesNotThrow;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class OrderWaiterMutationGateTest {

    @Mock
    FloorTenantSupport tenantSupport;

    @Mock
    ForeignTableOrderService foreignTableOrderService;

    @InjectMocks
    OrderWaiterMutationGate gate;

    @Test
    void allowsManagerAlways() {
        FloorOrder order = order(UUID.randomUUID());
        when(tenantSupport.role()).thenReturn("MANAGER");
        assertDoesNotThrow(() -> gate.assertCanMutate(order));
    }

    @Test
    void allowsWaiterWhenForeignEnabled() {
        FloorOrder order = order(UUID.randomUUID());
        when(tenantSupport.role()).thenReturn("WAITER");
        when(foreignTableOrderService.isAllowed(1, 2)).thenReturn(true);
        assertDoesNotThrow(() -> gate.assertCanMutate(order));
    }

    @Test
    void allowsWaiterOnOwnOrder() {
        UUID me = UUID.randomUUID();
        FloorOrder order = order(me);
        when(tenantSupport.role()).thenReturn("WAITER");
        when(foreignTableOrderService.isAllowed(1, 2)).thenReturn(false);
        when(tenantSupport.requireUserId()).thenReturn(me);
        assertDoesNotThrow(() -> gate.assertCanMutate(order));
    }

    @Test
    void blocksWaiterOnForeignOrder() {
        FloorOrder order = order(UUID.randomUUID());
        when(tenantSupport.role()).thenReturn("WAITER");
        when(foreignTableOrderService.isAllowed(1, 2)).thenReturn(false);
        when(tenantSupport.requireUserId()).thenReturn(UUID.randomUUID());
        assertThrows(ForbiddenException.class, () -> gate.assertCanMutate(order));
    }

    private static FloorOrder order(UUID waiterId) {
        return FloorOrder.builder()
            .companyId(1)
            .storeId(2)
            .waiterUserId(waiterId)
            .build();
    }
}
