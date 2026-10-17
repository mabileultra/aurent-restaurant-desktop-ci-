package com.pos.restaurant.payment.support;

import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

class BillRequestAccessTest {

    @Test
    void cashierAdminAndManagerKeepTheBillWithoutAnExtraGrant() {
        assertTrue(BillRequestAccess.allowed("CASHIER", false));
        assertTrue(BillRequestAccess.allowed("ADMIN", false));
        assertTrue(BillRequestAccess.allowed("manager", false));
    }

    @Test
    void waiterNeedsTheGrantedClaim() {
        assertFalse(BillRequestAccess.allowed("WAITER", false));
        assertTrue(BillRequestAccess.allowed("WAITER", true));
        assertFalse(BillRequestAccess.allowed("COOK", true));
    }
}
