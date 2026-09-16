package com.pos.pharmacy.shift.support;

import com.pos.pharmacy.sales.domain.SaleEnums;
import com.pos.pharmacy.shift.entity.PharmacyCashierShift;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;

import static org.junit.jupiter.api.Assertions.assertEquals;

class PharmacyShiftSaleAccumulatorTest {

    private final PharmacyShiftSaleAccumulator accumulator = new PharmacyShiftSaleAccumulator();

    @Test
    void refundSubtractsRevenueFromOpenShift() {
        PharmacyCashierShift shift = PharmacyCashierShift.builder()
            .totalAmount(new BigDecimal("15000.00"))
            .cashAmount(new BigDecimal("15000.00"))
            .cardAmount(BigDecimal.ZERO)
            .vatAmount(new BigDecimal("1607.14"))
            .saleCount(1)
            .build();

        accumulator.applyRefund(
            shift,
            new BigDecimal("5000.00"),
            new BigDecimal("5000.00"),
            BigDecimal.ZERO,
            new BigDecimal("535.71"),
            SaleEnums.PaymentMethod.CASH
        );

        assertEquals(new BigDecimal("10000.00"), shift.getTotalAmount());
        assertEquals(new BigDecimal("10000.00"), shift.getCashAmount());
        assertEquals(new BigDecimal("1071.43"), shift.getVatAmount());
        assertEquals(1, shift.getSaleCount());
    }

    @Test
    void refundDoesNotDriveShiftTotalsNegative() {
        PharmacyCashierShift shift = PharmacyCashierShift.builder()
            .totalAmount(new BigDecimal("100.00"))
            .cashAmount(new BigDecimal("100.00"))
            .cardAmount(BigDecimal.ZERO)
            .vatAmount(BigDecimal.ZERO)
            .build();

        accumulator.applyRefund(
            shift,
            new BigDecimal("250.00"),
            new BigDecimal("250.00"),
            BigDecimal.ZERO,
            BigDecimal.ZERO,
            SaleEnums.PaymentMethod.CASH
        );

        assertEquals(BigDecimal.ZERO, shift.getTotalAmount());
        assertEquals(BigDecimal.ZERO, shift.getCashAmount());
    }
}
