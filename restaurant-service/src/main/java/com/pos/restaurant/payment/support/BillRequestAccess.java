package com.pos.restaurant.payment.support;

import com.pos.restaurant.security.RestaurantTenantContext;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Component;

/**
 * Cashier, manager and admin keep the guest-bill button by role.
 * A waiter may request the bill only when the access screen granted it.
 */
@Component
public class BillRequestAccess {

    public void assertAllowed() {
        if (!allowed(RestaurantTenantContext.getRole(), RestaurantTenantContext.canRequestBill())) {
            throw new AccessDeniedException("Requesting a bill is not allowed for this user");
        }
    }

    static boolean allowed(String role, boolean granted) {
        String normalized = role == null ? "" : role.trim().toUpperCase();
        if ("ADMIN".equals(normalized) || "MANAGER".equals(normalized) || "CASHIER".equals(normalized)) {
            return true;
        }
        return "WAITER".equals(normalized) && granted;
    }
}
