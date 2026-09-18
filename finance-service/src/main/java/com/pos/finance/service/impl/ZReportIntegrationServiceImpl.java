package com.pos.finance.service.impl;

import com.pos.finance.dto.integration.ZReportIncomeRequest;
import com.pos.finance.entity.AccountType;
import com.pos.finance.entity.FinancialAccount;
import com.pos.finance.entity.Income;
import com.pos.finance.entity.IncomeCategory;
import com.pos.finance.entity.IncomeSourceType;
import com.pos.finance.entity.PaymentMethod;
import com.pos.finance.repository.IncomeRepository;
import com.pos.finance.service.ZReportIntegrationService;
import com.pos.finance.service.support.AccountBalanceSupport;
import com.pos.finance.service.support.AccountResolverSupport;
import com.pos.finance.service.support.CashRegisterIncomePolicy;
import com.pos.finance.service.support.CompanyBootstrapSupport;
import com.pos.shared.log.LogUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;

@Service
@RequiredArgsConstructor
@Transactional
public class ZReportIntegrationServiceImpl implements ZReportIntegrationService {

    private final IncomeRepository incomeRepository;
    private final CompanyBootstrapSupport bootstrapSupport;
    private final AccountBalanceSupport balanceSupport;
    private final AccountResolverSupport accountResolver;
    private final CashRegisterIncomePolicy incomePolicy;

    @Override
    public void recordZReportIncome(ZReportIncomeRequest request) {
        if (incomePolicy.prefersSaleLedger(request.companyId())) {
            LogUtil.info(
                ZReportIntegrationServiceImpl.class,
                "Z-report income skipped: sale ledger already exists companyId={}, zReportId={}",
                request.companyId(),
                request.zReportId()
            );
            return;
        }
        String groupKey = "z-report:" + request.zReportId();
        if (incomeRepository.existsZReportIncome(request.companyId(), groupKey)) {
            LogUtil.info(
                ZReportIntegrationServiceImpl.class,
                "Z-report income already recorded: zReportId={}",
                request.zReportId()
            );
            return;
        }
        bootstrapSupport.ensureBootstrapped(request.companyId());
        IncomeCategory salesCategory = bootstrapSupport.requireSalesCategory(request.companyId());
        LocalDate txDate = request.transactionDate() != null ? request.transactionDate() : LocalDate.now();

        BigDecimal cashAmount = nullSafe(request.cashAmount());
        BigDecimal cardAmount = nullSafe(request.cardAmount());
        BigDecimal cashlessAmount = nullSafe(request.cashlessAmount());

        String comment = buildComment(request);

        if (cashAmount.signum() > 0) {
            recordPart(
                request, salesCategory, txDate, cashAmount, PaymentMethod.CASH, AccountType.CASH, groupKey, comment
            );
        }
        if (cardAmount.signum() > 0) {
            recordPart(
                request, salesCategory, txDate, cardAmount, PaymentMethod.CARD, AccountType.CARD, groupKey, comment
            );
        }
        if (cashlessAmount.signum() > 0) {
            recordPart(
                request, salesCategory, txDate, cashlessAmount, PaymentMethod.BANK, AccountType.BANK, groupKey, comment
            );
        }
    }

    private static String buildComment(ZReportIncomeRequest request) {
        return "Выручка Z-отчёт №" + request.zNumber() + ", " + request.salesCount() + " чеков";
    }

    private static BigDecimal nullSafe(BigDecimal value) {
        return value != null ? value : BigDecimal.ZERO;
    }

    private void recordPart(
        ZReportIncomeRequest request,
        IncomeCategory category,
        LocalDate txDate,
        BigDecimal amount,
        PaymentMethod paymentMethod,
        AccountType accountType,
        String groupKey,
        String comment
    ) {
        FinancialAccount account = accountResolver.resolveOrCreate(request.companyId(), request.storeId(), accountType);
        String sourceId = groupKey + ":" + paymentMethod.name().toLowerCase();
        if (incomeRepository.existsByCompanyIdAndSourceTypeAndSourceIdAndDeletedFalse(
            request.companyId(), IncomeSourceType.Z_REPORT, sourceId
        )) {
            return;
        }
        Income income = Income.builder()
            .companyId(request.companyId())
            .storeId(request.storeId())
            .account(account)
            .amount(amount)
            .currency("UZS")
            .paymentMethod(paymentMethod)
            .incomeCategory(category)
            .sourceType(IncomeSourceType.Z_REPORT)
            .sourceId(sourceId)
            .comment(comment)
            .transactionDate(txDate)
            .deleted(false)
            .createdBy(request.createdBy())
            .build();
        incomeRepository.save(income);
        if (amount.signum() > 0) {
            balanceSupport.credit(account, amount);
        }
        LogUtil.info(
            ZReportIntegrationServiceImpl.class,
            "Z-report income recorded: zReport={}, amount={}, account={}",
            request.zReportId(),
            amount,
            account.getName()
        );
    }
}
