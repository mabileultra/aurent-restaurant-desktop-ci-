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

        accumulator.applyPayment(shift, PaymentMethod.CASH, new BigDecimal("10.00"), null, null);
        accumulator.applyPayment(shift, PaymentMethod.CARD, new BigDecimal("25.50"), null, null);
        accumulator.applyPayment(shift, PaymentMethod.CASHLESS, new BigDecimal("4.50"), null, null);
        accumulator.applyPayment(
            shift,
            PaymentMethod.MIXED,
            new BigDecimal("30.00"),
            new BigDecimal("10.00"),
            new BigDecimal("20.00")
        );

        assertEquals(4, shift.getSaleCount());
        assertEquals(new BigDecimal("70.00"), shift.getTotalAmount());
        assertEquals(new BigDecimal("20.00"), shift.getCashAmount());
        assertEquals(new BigDecimal("50.00"), shift.getCardAmount());
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
        accumulator.applyPayment(shift, PaymentMethod.CASH, new BigDecimal("40.00"), null, null);
        accumulator.applyRefund(shift, PaymentMethod.CASH, new BigDecimal("15.00"), null, null);

        assertEquals(new BigDecimal("25.00"), shift.getTotalAmount());
        assertEquals(new BigDecimal("25.00"), shift.getCashAmount());
    }
}
