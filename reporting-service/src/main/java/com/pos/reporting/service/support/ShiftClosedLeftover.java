package com.pos.reporting.service.support;

import java.math.BigDecimal;

public final class ShiftClosedLeftover {

    private ShiftClosedLeftover() {
    }

    public static boolean hideEmptySibling(Integer salesCount, BigDecimal totalSales, boolean hasOtherFactForShift) {
        int sales = salesCount != null ? salesCount : 0;
        boolean empty = sales == 0 && (totalSales == null || totalSales.signum() == 0);
        return empty && hasOtherFactForShift;
    }
}
