package com.pos.finance.service.support;

import com.pos.finance.entity.IncomeSourceType;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertEquals;

class IncomeListScopeTest {

    @Test
    void hidesDuplicateZWhenSaleLedgerIsActive() {
        IncomeListScope operations = IncomeListScope.of(true, true, null);
        IncomeListScope all = IncomeListScope.of(false, true, null);

        assertEquals(new IncomeListScope(false, true), operations);
        assertEquals(new IncomeListScope(false, true), all);
    }

    @Test
    void hidesSaleOnOperationsTabForLegacyZLedger() {
        assertEquals(new IncomeListScope(true, false), IncomeListScope.of(true, false, null));
        assertEquals(new IncomeListScope(false, false), IncomeListScope.of(false, false, null));
    }

    @Test
    void keepsExplicitSourceTypeFilter() {
        assertEquals(
            new IncomeListScope(false, false),
            IncomeListScope.of(true, true, IncomeSourceType.Z_REPORT)
        );
    }
}
