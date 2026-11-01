package com.pos.restaurant.order.support;

import com.pos.restaurant.exception.ForbiddenException;
import com.pos.restaurant.floor.support.FloorTenantSupport;
import com.pos.restaurant.order.entity.FloorOrder;
import com.pos.restaurant.settings.service.ForeignTableOrderService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.util.Objects;
import java.util.UUID;

/**
 * When the store disables foreign-table orders, a WAITER may only mutate
 * lines on orders where they are the assigned waiter. Managers/cashiers skip the gate.
 */
@Component
@RequiredArgsConstructor
public class OrderWaiterMutationGate {

    private final FloorTenantSupport tenantSupport;
    private final ForeignTableOrderService foreignTableOrderService;

    public void assertCanMutate(FloorOrder order) {
        if (order == null) {
            return;
        }
        String role = tenantSupport.role();
        if (role == null || !"WAITER".equalsIgnoreCase(role.trim())) {
            return;
        }
        if (foreignTableOrderService.isAllowed(order.getCompanyId(), order.getStoreId())) {
            return;
        }
        UUID owner = order.getWaiterUserId();
        if (owner == null) {
            return;
        }
        UUID me = tenantSupport.requireUserId();
        if (Objects.equals(me, owner)) {
            return;
        }
        throw new ForbiddenException("FOREIGN_TABLE_ORDER_FORBIDDEN");
    }
}
