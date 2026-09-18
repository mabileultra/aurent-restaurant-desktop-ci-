package com.pos.finance.service.impl;

import com.pos.finance.dto.integration.SaleIncomeRequest;
import com.pos.finance.entity.AccountType;
import com.pos.finance.entity.FinancialAccount;
import com.pos.finance.entity.IncomeCategory;
import com.pos.finance.repository.IncomeRepository;
import com.pos.finance.service.support.AccountBalanceSupport;
import com.pos.finance.service.support.AccountResolverSupport;
import com.pos.finance.service.support.CompanyBootstrapSupport;
import com.pos.finance.service.support.DuplicateZReportIncomeReversal;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class SaleIntegrationServiceImplTest {

    @Mock
    private IncomeRepository incomeRepository;

    @Mock
    private CompanyBootstrapSupport bootstrapSupport;

    @Mock
    private AccountBalanceSupport balanceSupport;

    @Mock
    private AccountResolverSupport accountResolver;

    @Mock
    private DuplicateZReportIncomeReversal duplicateZReportIncomeReversal;

    private SaleIntegrationServiceImpl service;

    @BeforeEach
    void setUp() {
        service = new SaleIntegrationServiceImpl(
            incomeRepository,
            bootstrapSupport,
            balanceSupport,
            accountResolver,
            duplicateZReportIncomeReversal
        );
    }

    @Test
    void reversesDuplicateZAfterSaleIsPosted() {
        UUID saleId = UUID.randomUUID();
        when(incomeRepository.existsByCompanyIdAndSourceTypeAndSourceIdAndDeletedFalse(any(), any(), any()))
            .thenReturn(false);
        when(bootstrapSupport.requireSalesCategory(7)).thenReturn(IncomeCategory.builder().name("Продажи").build());
        when(accountResolver.resolveOrCreate(eq(7), eq(3), eq(AccountType.CASH)))
            .thenReturn(FinancialAccount.builder().name("Касса").balance(BigDecimal.ZERO).build());

        service.recordSaleIncome(new SaleIncomeRequest(
            7,
            3,
            saleId,
            "A-1",
            new BigDecimal("10000"),
            new BigDecimal("10000"),
            BigDecimal.ZERO,
            "CASH",
            null,
            LocalDate.of(2026, 9, 11),
            null
        ));

        verify(duplicateZReportIncomeReversal).reverseIfSaleLedgerExists(7);
    }

    @Test
    void stillHealsDuplicatesWhenSaleWasAlreadyRecorded() {
        UUID saleId = UUID.randomUUID();
        when(incomeRepository.existsByCompanyIdAndSourceTypeAndSourceIdAndDeletedFalse(any(), any(), any()))
            .thenReturn(true);

        service.recordSaleIncome(new SaleIncomeRequest(
            7,
            3,
            saleId,
            "A-1",
            new BigDecimal("10000"),
            new BigDecimal("10000"),
            BigDecimal.ZERO,
            "CASH",
            null,
            LocalDate.of(2026, 9, 11),
            null
        ));

        verify(duplicateZReportIncomeReversal).reverseIfSaleLedgerExists(7);
    }
}
