package com.pos.restaurant.floor.support;

import com.pos.restaurant.exception.ForbiddenException;
import com.pos.restaurant.security.RestaurantTenantContext;
import org.springframework.stereotype.Component;

import java.util.UUID;

@Component
public class FloorTenantSupport {

    public Integer requireCompanyId() {
        Integer companyId = RestaurantTenantContext.getCompanyId();
        if (companyId == null) {
            throw new ForbiddenException("Company context is required");
        }
        return companyId;
    }

    public UUID requireUserId() {
        UUID userId = RestaurantTenantContext.getUserId();
        if (userId == null) {
            throw new ForbiddenException("User context is required");
        }
        return userId;
    }

    public String role() {
        return RestaurantTenantContext.getRole();
    }

    public boolean isManager() {
        String role = role();
        return "ADMIN".equals(role) || "MANAGER".equals(role);
    }

    /** Cancel order with lines / refuse kitchen-sent dishes. */
    public boolean canCancelOrdersWithItems() {
        String role = role();
        return "ADMIN".equals(role) || "MANAGER".equals(role) || "CASHIER".equals(role);
    }

    public void assertCompany(Integer entityCompanyId) {
        Integer companyId = requireCompanyId();
        if (!companyId.equals(entityCompanyId)) {
            throw new ForbiddenException("Access denied for this company");
        }
    }
}
