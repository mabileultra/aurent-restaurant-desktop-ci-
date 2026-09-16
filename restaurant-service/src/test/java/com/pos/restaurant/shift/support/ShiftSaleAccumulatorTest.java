package com.pos.restaurant.shift.support;

import com.pos.restaurant.payment.domain.PaymentMethod;
import com.pos.restaurant.shift.domain.RestaurantShiftStatus;
import com.pos.restaurant.shift.entity.RestaurantShift;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertEquals;

class ShiftSaleAccumulatorTest {

    private final ShiftSaleAccumulator accumulator = new ShiftSaleAccumulator();

    @Test
    void accumulatesCashAndCardSeparately() {
        RestaurantShift shift = RestaurantShift.builder()
            .id(UUID.randomUUID())
            .companyId(1)
            .storeId(1)
            .openedByUserId(UUID.randomUUID())
            .status(RestaurantShiftStatus.OPEN)
            .build();

        accumulator.applyPayment(shift, PaymentMethod.CASH, new BigDecimal("10.00"));
        accumulator.applyPayment(shift, PaymentMethod.CARD, new BigDecimal("25.50"));

        assertEquals(2, shift.getSaleCount());
        assertEquals(new BigDecimal("35.50"), shift.getTotalAmount());
        assertEquals(new BigDecimal("10.00"), shift.getCashAmount());
        assertEquals(new BigDecimal("25.50"), shift.getCardAmount());
    }

    @Test
    void refundSubtractsRevenue() {
        RestaurantShift shift = RestaurantShift.builder()
            .id(UUID.randomUUID())
            .companyId(1)
            .storeId(1)
            .openedByUserId(UUID.randomUUID())
            .status(RestaurantShiftStatus.OPEN)
            .build();
        accumulator.applyPayment(shift, PaymentMethod.CASH, new BigDecimal("40.00"));
        accumulator.applyRefund(shift, PaymentMethod.CASH, new BigDecimal("15.00"));

        assertEquals(new BigDecimal("25.00"), shift.getTotalAmount());
        assertEquals(new BigDecimal("25.00"), shift.getCashAmount());
    }
}
