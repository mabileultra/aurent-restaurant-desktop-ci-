package com.pos.finance.service.support;

import com.pos.finance.entity.FinancialAccount;
import com.pos.finance.entity.Income;
import com.pos.finance.entity.IncomeSourceType;
import com.pos.finance.repository.IncomeRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class DuplicateZReportIncomeReversalTest {

    private static final Integer COMPANY_ID = 7;

    @Mock
    private IncomeRepository incomeRepository;

    @Mock
    private CashRegisterIncomePolicy incomePolicy;

    @Mock
    private AccountBalanceSupport balanceSupport;

    private DuplicateZReportIncomeReversal reversal;

    @BeforeEach
    void setUp() {
        reversal = new DuplicateZReportIncomeReversal(incomeRepository, incomePolicy, balanceSupport);
    }

    @Test
    void voidsZReportIncomesAndReversesAccountCredits() {
        when(incomePolicy.prefersSaleLedger(COMPANY_ID)).thenReturn(true);
        FinancialAccount cash = FinancialAccount.builder()
            .name("Касса")
            .balance(new BigDecimal("200000"))
            .build();
        Income duplicate = Income.builder()
            .id(UUID.randomUUID())
            .companyId(COMPANY_ID)
            .account(cash)
            .amount(new BigDecimal("50000"))
            .sourceType(IncomeSourceType.Z_REPORT)
            .deleted(false)
            .build();
        when(incomeRepository.findUndeletedWithAccount(COMPANY_ID, IncomeSourceType.Z_REPORT))
            .thenReturn(List.of(duplicate));

        assertEquals(1, reversal.reverseIfSaleLedgerExists(COMPANY_ID));
        verify(balanceSupport).reverseCredit(cash, new BigDecimal("50000"));
        assertTrue(duplicate.isDeleted());
        verify(incomeRepository).save(duplicate);
    }

    @Test
    void skipsWhenCompanyHasNoSaleLedger() {
        when(incomePolicy.prefersSaleLedger(COMPANY_ID)).thenReturn(false);

        assertEquals(0, reversal.reverseIfSaleLedgerExists(COMPANY_ID));
        verify(incomeRepository, never()).findUndeletedWithAccount(COMPANY_ID, IncomeSourceType.Z_REPORT);
    }
}
