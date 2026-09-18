package com.pos.finance.service.impl;

import com.pos.finance.dto.integration.ZReportIncomeRequest;
import com.pos.finance.repository.IncomeRepository;
import com.pos.finance.service.support.AccountBalanceSupport;
import com.pos.finance.service.support.AccountResolverSupport;
import com.pos.finance.service.support.CashRegisterIncomePolicy;
import com.pos.finance.service.support.CompanyBootstrapSupport;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.time.LocalDate;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyInt;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class ZReportIntegrationServiceImplTest {

    @Mock
    private IncomeRepository incomeRepository;

    @Mock
    private CompanyBootstrapSupport bootstrapSupport;

    @Mock
    private AccountBalanceSupport balanceSupport;

    @Mock
    private AccountResolverSupport accountResolver;

    @Mock
    private CashRegisterIncomePolicy incomePolicy;

    private ZReportIntegrationServiceImpl service;

    @BeforeEach
    void setUp() {
        service = new ZReportIntegrationServiceImpl(
            incomeRepository,
            bootstrapSupport,
            balanceSupport,
            accountResolver,
            incomePolicy
        );
    }

    @Test
    void skipsZReportWhenSaleLedgerAlreadyExists() {
        when(incomePolicy.prefersSaleLedger(7)).thenReturn(true);

        service.recordZReportIncome(request());

        verify(incomeRepository, never()).existsZReportIncome(anyInt(), anyString());
        verify(bootstrapSupport, never()).ensureBootstrapped(any());
        verify(balanceSupport, never()).credit(any(), any());
    }

    @Test
    void recordsZReportForLegacyCompaniesWithoutSale() {
        when(incomePolicy.prefersSaleLedger(7)).thenReturn(false);
        when(incomeRepository.existsZReportIncome(7, "z-report:99")).thenReturn(true);

        service.recordZReportIncome(request());

        verify(incomeRepository).existsZReportIncome(7, "z-report:99");
        verify(bootstrapSupport, never()).ensureBootstrapped(7);
        verify(balanceSupport, never()).credit(any(), any());
    }

    private static ZReportIncomeRequest request() {
        return new ZReportIncomeRequest(
            7,
            3,
            99L,
            9,
            null,
            new BigDecimal("26915033"),
            new BigDecimal("25150000"),
            BigDecimal.ZERO,
            120,
            LocalDate.of(2026, 9, 11),
            null
        );
    }
}
