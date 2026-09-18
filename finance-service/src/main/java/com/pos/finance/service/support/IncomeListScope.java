package com.pos.finance.service.support;

import com.pos.finance.entity.IncomeSourceType;

public record IncomeListScope(boolean excludeSale, boolean excludeZReport) {

    public static IncomeListScope of(
        boolean excludeSale,
        boolean prefersSaleLedger,
        IncomeSourceType sourceType
    ) {
        if (sourceType != null) {
            return new IncomeListScope(false, false);
        }
        if (prefersSaleLedger) {
            return new IncomeListScope(false, true);
        }
        return new IncomeListScope(excludeSale, false);
    }
}
