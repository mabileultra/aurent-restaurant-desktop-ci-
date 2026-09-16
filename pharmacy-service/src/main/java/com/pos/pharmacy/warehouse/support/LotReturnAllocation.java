package com.pos.pharmacy.warehouse.support;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;

/**
 * Сколько вернуть в каждую партию. Списания идут с конца (последняя взятая серия — первая к возврату).
 */
public final class LotReturnAllocation {

    private LotReturnAllocation() {}

    public record Restore(int indexFromEnd, BigDecimal giveBack, BigDecimal remainingAllocation) {}

    public static List<Restore> plan(List<BigDecimal> allocationNewestLast, BigDecimal returnQty) {
        List<Restore> plan = new ArrayList<>();
        if (allocationNewestLast == null || allocationNewestLast.isEmpty() || returnQty == null) {
            return plan;
        }
        BigDecimal remaining = returnQty;
        for (int i = allocationNewestLast.size() - 1; i >= 0 && remaining.signum() > 0; i--) {
            BigDecimal allocated = allocationNewestLast.get(i) != null ? allocationNewestLast.get(i) : BigDecimal.ZERO;
            if (allocated.signum() <= 0) {
                continue;
            }
            BigDecimal give = allocated.min(remaining);
            plan.add(new Restore(i, give, allocated.subtract(give)));
            remaining = remaining.subtract(give);
        }
        return plan;
    }
}
