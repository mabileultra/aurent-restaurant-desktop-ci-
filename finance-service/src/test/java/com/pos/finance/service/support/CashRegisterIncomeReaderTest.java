package com.pos.finance.service.support;

import com.pos.finance.entity.IncomeSourceType;
import com.pos.finance.repository.IncomeRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.time.LocalDate;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoMoreInteractions;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class CashRegisterIncomeReaderTest {

    private static final Integer COMPANY_ID = 7;
    private static final LocalDate FROM = LocalDate.of(2026, 9, 1);
    private static final LocalDate TO = LocalDate.of(2026, 9, 19);

    @Mock
    private IncomeRepository incomeRepository;

    @Mock
    private CashRegisterIncomePolicy incomePolicy;

    private CashRegisterIncomeReader reader;

    @BeforeEach
    void setUp() {
        reader = new CashRegisterIncomeReader(incomeRepository, incomePolicy);
    }

    @Test
    void sumsOnlySaleWhenCheckoutLedgerExists() {
        when(incomePolicy.prefersSaleLedger(COMPANY_ID)).thenReturn(true);
        when(incomePolicy.registerSource(COMPANY_ID)).thenReturn(IncomeSourceType.SALE);
        when(incomeRepository.sumBySourceAndPeriod(COMPANY_ID, IncomeSourceType.SALE, FROM, TO, null))
            .thenReturn(new BigDecimal("108810027"));
        when(incomeRepository.countDistinctSourceIdBySourceAndPeriod(
            COMPANY_ID, IncomeSourceType.SALE, FROM, TO, null
        )).thenReturn(412L);
        when(incomeRepository.sumByPeriodExcludingSource(COMPANY_ID, IncomeSourceType.Z_REPORT, FROM, TO, null))
            .thenReturn(new BigDecimal("108810027"));

        assertEquals(new BigDecimal("108810027"), reader.sumRegisterRevenue(COMPANY_ID, FROM, TO, null));
        assertEquals(412L, reader.countRegisterReceipts(COMPANY_ID, FROM, TO, null));
        assertEquals(new BigDecimal("108810027"), reader.sumIncome(COMPANY_ID, FROM, TO, null));

        verify(incomeRepository).sumBySourceAndPeriod(COMPANY_ID, IncomeSourceType.SALE, FROM, TO, null);
        verify(incomeRepository).countDistinctSourceIdBySourceAndPeriod(
            COMPANY_ID, IncomeSourceType.SALE, FROM, TO, null
        );
        verify(incomeRepository).sumByPeriodExcludingSource(COMPANY_ID, IncomeSourceType.Z_REPORT, FROM, TO, null);
        verifyNoMoreInteractions(incomeRepository);
    }

    @Test
    void keepsZReportTotalsForLegacyCompanies() {
        when(incomePolicy.prefersSaleLedger(COMPANY_ID)).thenReturn(false);
        when(incomePolicy.registerSource(COMPANY_ID)).thenReturn(IncomeSourceType.Z_REPORT);
        when(incomeRepository.sumBySourceAndPeriod(COMPANY_ID, IncomeSourceType.Z_REPORT, FROM, TO, null))
            .thenReturn(new BigDecimal("50000"));
        when(incomeRepository.countDistinctZReportGroups(COMPANY_ID, FROM, TO, null)).thenReturn(3L);
        when(incomeRepository.sumByPeriod(COMPANY_ID, FROM, TO, null)).thenReturn(new BigDecimal("50000"));

        assertEquals(new BigDecimal("50000"), reader.sumRegisterRevenue(COMPANY_ID, FROM, TO, null));
        assertEquals(3L, reader.countRegisterReceipts(COMPANY_ID, FROM, TO, null));
        assertEquals(new BigDecimal("50000"), reader.sumIncome(COMPANY_ID, FROM, TO, null));

        verify(incomeRepository).countDistinctZReportGroups(COMPANY_ID, FROM, TO, null);
        verify(incomeRepository).sumByPeriod(COMPANY_ID, FROM, TO, null);
    }
}
