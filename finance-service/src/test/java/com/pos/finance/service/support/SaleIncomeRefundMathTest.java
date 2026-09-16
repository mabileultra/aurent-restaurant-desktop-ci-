package com.pos.finance.service.support;

import org.junit.jupiter.api.Test;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertEquals;

class SaleIncomeRefundMathTest {

    @Test
    void reducesCashSaleIncomeByRefund() {
        UUID id = UUID.randomUUID();
        List<SaleIncomeRefundMath.Adjustment> adjustments = SaleIncomeRefundMath.reduce(
            List.of(new SaleIncomeRefundMath.Slice(id, "CASH", new BigDecimal("10000.00"))),
            new BigDecimal("2500.00"),
            BigDecimal.ZERO
        );
        assertEquals(1, adjustments.size());
        assertEquals(new BigDecimal("7500.00"), adjustments.get(0).newAmount());
    }

    @Test
    void splitsMixedTenderAcrossIncomeRows() {
        UUID cash = UUID.randomUUID();
        UUID card = UUID.randomUUID();
        List<SaleIncomeRefundMath.Adjustment> adjustments = SaleIncomeRefundMath.reduce(
            List.of(
                new SaleIncomeRefundMath.Slice(cash, "CASH", new BigDecimal("40.00")),
                new SaleIncomeRefundMath.Slice(card, "CARD", new BigDecimal("60.00"))
            ),
            new BigDecimal("10.00"),
            new BigDecimal("15.00")
        );
        assertEquals(new BigDecimal("30.00"), adjustments.get(0).newAmount());
        assertEquals(new BigDecimal("45.00"), adjustments.get(1).newAmount());
    }
}
