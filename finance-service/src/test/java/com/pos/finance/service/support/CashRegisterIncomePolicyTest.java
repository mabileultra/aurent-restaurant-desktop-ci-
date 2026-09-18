package com.pos.finance.service.support;

import com.pos.finance.entity.IncomeSourceType;
import com.pos.finance.repository.IncomeRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class CashRegisterIncomePolicyTest {

    @Mock
    private IncomeRepository incomeRepository;

    private CashRegisterIncomePolicy policy;

    @BeforeEach
    void setUp() {
        policy = new CashRegisterIncomePolicy(incomeRepository);
    }

    @Test
    void usesSaleWhenCheckoutIncomesExist() {
        when(incomeRepository.existsByCompanyIdAndSourceTypeAndDeletedFalse(7, IncomeSourceType.SALE))
            .thenReturn(true);

        assertTrue(policy.prefersSaleLedger(7));
        assertEquals(IncomeSourceType.SALE, policy.registerSource(7));
    }

    @Test
    void keepsZReportForLegacyCompaniesWithoutSaleIncomes() {
        when(incomeRepository.existsByCompanyIdAndSourceTypeAndDeletedFalse(7, IncomeSourceType.SALE))
            .thenReturn(false);

        assertFalse(policy.prefersSaleLedger(7));
        assertEquals(IncomeSourceType.Z_REPORT, policy.registerSource(7));
    }
}
