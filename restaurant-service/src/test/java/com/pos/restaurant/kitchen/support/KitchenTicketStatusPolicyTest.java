package com.pos.restaurant.kitchen.support;

import com.pos.restaurant.exception.BusinessException;
import com.pos.restaurant.kitchen.domain.KitchenTicketStatus;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertDoesNotThrow;
import static org.junit.jupiter.api.Assertions.assertThrows;

class KitchenTicketStatusPolicyTest {

    private final KitchenTicketStatusPolicy policy = new KitchenTicketStatusPolicy();

    @Test
    void allowsForwardFlow() {
        assertDoesNotThrow(() -> policy.assertTransition(KitchenTicketStatus.NEW, KitchenTicketStatus.ACCEPTED));
        assertDoesNotThrow(() -> policy.assertTransition(KitchenTicketStatus.ACCEPTED, KitchenTicketStatus.PREPARING));
        assertDoesNotThrow(() -> policy.assertTransition(KitchenTicketStatus.PREPARING, KitchenTicketStatus.READY));
        assertDoesNotThrow(() -> policy.assertTransition(KitchenTicketStatus.READY, KitchenTicketStatus.SERVED));
    }

    @Test
    void rejectsSkipFromNewToReady() {
        assertThrows(BusinessException.class, () ->
            policy.assertTransition(KitchenTicketStatus.NEW, KitchenTicketStatus.READY));
    }

    @Test
    void servedIsTerminal() {
        assertThrows(BusinessException.class, () ->
            policy.assertTransition(KitchenTicketStatus.SERVED, KitchenTicketStatus.READY));
    }
}
