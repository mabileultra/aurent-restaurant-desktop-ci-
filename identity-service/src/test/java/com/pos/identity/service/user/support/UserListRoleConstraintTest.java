package com.pos.identity.service.user.support;

import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNull;

class UserListRoleConstraintTest {

    @Test
    void universalDoesNotRestrictRoles() {
        assertNull(UserListRoleConstraint.allowedRoles(null));
        assertNull(UserListRoleConstraint.allowedRoles(""));
        assertNull(UserListRoleConstraint.allowedRoles("UNIVERSAL"));
        assertNull(UserListRoleConstraint.allowedRoles("RETAIL"));
        assertNull(UserListRoleConstraint.allowedRoles("OTHER"));
    }

    @Test
    void pharmacyHidesFloorRoles() {
        assertEquals(
            java.util.List.of("ADMIN", "MANAGER", "CASHIER", "ACCOUNTANT"),
            UserListRoleConstraint.allowedRoles("pharmacy")
        );
    }

    @Test
    void restaurantKeepsFloorRoles() {
        assertEquals(
            java.util.List.of("ADMIN", "MANAGER", "CASHIER", "WAITER", "COOK"),
            UserListRoleConstraint.allowedRoles("CANTEEN")
        );
    }
}
