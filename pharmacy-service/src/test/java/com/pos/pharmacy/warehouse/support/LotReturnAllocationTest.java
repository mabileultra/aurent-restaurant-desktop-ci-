package com.pos.pharmacy.warehouse.support;

import org.junit.jupiter.api.Test;

import java.math.BigDecimal;
import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;

class LotReturnAllocationTest {

    @Test
    void partialReturnDoesNotRestoreTheSameUnitsTwice() {
        List<LotReturnAllocation.Restore> first = LotReturnAllocation.plan(
            List.of(new BigDecimal("2")),
            new BigDecimal("1")
        );
        assertEquals(1, first.size());
        assertEquals(new BigDecimal("1"), first.get(0).giveBack());
        assertEquals(new BigDecimal("1"), first.get(0).remainingAllocation());

        List<LotReturnAllocation.Restore> second = LotReturnAllocation.plan(
            List.of(first.get(0).remainingAllocation()),
            new BigDecimal("1")
        );
        assertEquals(new BigDecimal("1"), second.get(0).giveBack());
        assertEquals(new BigDecimal("0"), second.get(0).remainingAllocation());
    }

    @Test
    void restoresNewestAllocationFirst() {
        List<LotReturnAllocation.Restore> plan = LotReturnAllocation.plan(
            List.of(new BigDecimal("1"), new BigDecimal("3")),
            new BigDecimal("2")
        );
        assertEquals(1, plan.size());
        assertEquals(1, plan.get(0).indexFromEnd());
        assertEquals(new BigDecimal("2"), plan.get(0).giveBack());
    }
}
