package com.pos.finance.service.impl;

import com.pos.finance.dto.income.CreateIncomeRequest;
import com.pos.finance.dto.income.DailyRevenueSummaryDto;
import com.pos.finance.dto.income.IncomeDto;
import com.pos.finance.dto.income.UpdateIncomeRequest;
import com.pos.finance.dto.shared.PageResponse;
import com.pos.finance.entity.FinanceAuditAction;
import com.pos.finance.entity.FinanceAuditEntityType;
import com.pos.finance.entity.FinancialAccount;
import com.pos.finance.entity.Income;
import com.pos.finance.entity.IncomeCategory;
import com.pos.finance.entity.IncomeSourceType;
import com.pos.finance.entity.PaymentMethod;
import com.pos.finance.exception.FinanceExceptions;
import com.pos.finance.mapper.FinanceMapper;
import com.pos.finance.repository.IncomeCategoryRepository;
import com.pos.finance.repository.IncomeRepository;
import com.pos.finance.security.FinanceTenantContext;
import com.pos.finance.service.IncomeService;
import com.pos.finance.service.support.AccountBalanceSupport;
import com.pos.finance.service.support.CashRegisterIncomePolicy;
import com.pos.finance.service.support.CashRegisterIncomeReader;
import com.pos.finance.service.support.CompanyBootstrapSupport;
import com.pos.finance.service.support.CurrencySupport;
import com.pos.finance.service.support.FinanceAuditSupport;
import com.pos.finance.service.support.IncomeListScope;
import com.pos.shared.log.LogUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Transactional
public class IncomeServiceImpl implements IncomeService {

    private final IncomeRepository incomeRepository;
    private final IncomeCategoryRepository incomeCategoryRepository;
    private final FinanceMapper mapper;
    private final CompanyBootstrapSupport bootstrapSupport;
    private final AccountBalanceSupport balanceSupport;
    private final FinanceAuditSupport auditSupport;
    private final CashRegisterIncomePolicy incomePolicy;
    private final CashRegisterIncomeReader cashRegisterIncomeReader;

    @Override
    @Transactional(readOnly = true)
    public PageResponse<IncomeDto> list(
        Integer storeId,
        LocalDate from,
        LocalDate to,
        PaymentMethod paymentMethod,
        boolean excludeSale,
        IncomeSourceType sourceType,
        Pageable pageable
    ) {
        Integer companyId = FinanceTenantContext.requireCompanyId();
        bootstrapSupport.ensureBootstrapped(companyId);
        IncomeListScope scope = IncomeListScope.of(
            excludeSale,
            incomePolicy.prefersSaleLedger(companyId),
            sourceType
        );
        return PageResponse.from(
            incomeRepository.search(
                companyId,
                storeId,
                from,
                to,
                paymentMethod,
                scope.excludeSale(),
                scope.excludeZReport(),
                sourceType,
                pageable
            )
                .map(mapper::toDto)
        );
    }

    @Override
    @Transactional(readOnly = true)
    public List<DailyRevenueSummaryDto> dailyRevenue(Integer storeId, LocalDate from, LocalDate to) {
        Integer companyId = FinanceTenantContext.requireCompanyId();
        bootstrapSupport.ensureBootstrapped(companyId);
        LocalDate periodFrom = from != null ? from : LocalDate.now().minusDays(30);
        LocalDate periodTo = to != null ? to : LocalDate.now();
        if (periodTo.isBefore(periodFrom)) {
            throw FinanceExceptions.badRequest("Дата «по» не может быть раньше «с»");
        }
        return cashRegisterIncomeReader.sumDailyRegisterRevenue(companyId, periodFrom, periodTo, storeId).stream()
            .map(row -> new DailyRevenueSummaryDto(
                (LocalDate) row[0],
                (Integer) row[1],
                (BigDecimal) row[2],
                (BigDecimal) row[3],
                (BigDecimal) row[4],
                row[5] != null ? ((Number) row[5]).longValue() : 0L
            ))
            .toList();
    }

    @Override
    public IncomeDto create(CreateIncomeRequest request) {
        Integer companyId = FinanceTenantContext.requireCompanyId();
        bootstrapSupport.ensureBootstrapped(companyId);
        FinancialAccount account = balanceSupport.requireAccount(request.accountId(), companyId);
        String currency = CurrencySupport.resolve(request.currency());
        CurrencySupport.requireMatchesAccount(currency, account);
        IncomeCategory category = incomeCategoryRepository.findByIdAndCompanyId(request.incomeCategoryId(), companyId)
            .orElseThrow(() -> FinanceExceptions.notFound("IncomeCategory", request.incomeCategoryId()));
        if (!category.isActive()) {
            throw FinanceExceptions.badRequest("Категория дохода отключена");
        }
        Income income = Income.builder()
            .companyId(companyId)
            .storeId(request.storeId())
            .account(account)
            .amount(request.amount())
            .currency(currency)
            .paymentMethod(request.paymentMethod())
            .incomeCategory(category)
            .sourceType(request.sourceType() != null ? request.sourceType() : IncomeSourceType.MANUAL)
            .comment(request.comment())
            .transactionDate(request.transactionDate() != null ? request.transactionDate() : LocalDate.now())
            .deleted(false)
            .createdBy(FinanceTenantContext.userId().orElse(null))
            .build();
        Income saved = incomeRepository.save(income);
        balanceSupport.credit(account, saved.getAmount());
        auditSupport.log(
            FinanceAuditAction.CREATE,
            FinanceAuditEntityType.INCOME,
            saved.getId(),
            "Приход: " + category.getName() + " " + saved.getAmount(),
            null
        );
        LogUtil.info(IncomeServiceImpl.class, "Income created: id={}, amount={}", saved.getId(), saved.getAmount());
        return mapper.toDto(saved);
    }

    @Override
    public IncomeDto update(UUID id, UpdateIncomeRequest request) {
        Integer companyId = FinanceTenantContext.requireCompanyId();
        Income income = incomeRepository.findByIdAndCompanyIdAndDeletedFalse(id, companyId)
            .orElseThrow(() -> FinanceExceptions.notFound("Income", id));
        if (income.getSourceType() != IncomeSourceType.MANUAL) {
            throw FinanceExceptions.badRequest("Изменять можно только ручные приходы");
        }
        FinancialAccount oldAccount = income.getAccount();
        FinancialAccount newAccount = balanceSupport.requireAccount(request.accountId(), companyId);
        String currency = CurrencySupport.resolve(request.currency());
        CurrencySupport.requireMatchesAccount(currency, newAccount);
        IncomeCategory category = incomeCategoryRepository.findByIdAndCompanyId(request.incomeCategoryId(), companyId)
            .orElseThrow(() -> FinanceExceptions.notFound("IncomeCategory", request.incomeCategoryId()));

        BigDecimal oldAmount = income.getAmount();
        BigDecimal newAmount = request.amount();
        if (!oldAccount.getId().equals(newAccount.getId())) {
            balanceSupport.debit(oldAccount, oldAmount);
            balanceSupport.credit(newAccount, newAmount);
        } else {
            BigDecimal delta = newAmount.subtract(oldAmount);
            if (delta.signum() > 0) {
                balanceSupport.credit(oldAccount, delta);
            } else if (delta.signum() < 0) {
                balanceSupport.debit(oldAccount, delta.abs());
            }
        }

        income.setAccount(newAccount);
        income.setAmount(newAmount);
        income.setCurrency(currency);
        income.setIncomeCategory(category);
        income.setPaymentMethod(request.paymentMethod());
        income.setStoreId(request.storeId());
        income.setComment(request.comment());
        income.setTransactionDate(request.transactionDate() != null ? request.transactionDate() : income.getTransactionDate());
        income.setUpdatedBy(FinanceTenantContext.userId().orElse(null));
        Income saved = incomeRepository.save(income);
        auditSupport.log(
            FinanceAuditAction.UPDATE,
            FinanceAuditEntityType.INCOME,
            saved.getId(),
            "Изменён приход: " + saved.getAmount(),
            null
        );
        return mapper.toDto(saved);
    }

    @Override
    public void delete(UUID id) {
        if (!FinanceTenantContext.isFinanceAdmin()) {
            throw FinanceExceptions.forbidden("Удаление приходов доступно только FINANCE_ADMIN");
        }
        Integer companyId = FinanceTenantContext.requireCompanyId();
        Income income = incomeRepository.findByIdAndCompanyIdAndDeletedFalse(id, companyId)
            .orElseThrow(() -> FinanceExceptions.notFound("Income", id));
        if (income.getSourceType() != IncomeSourceType.MANUAL) {
            throw FinanceExceptions.badRequest("Удалять можно только ручные приходы");
        }
        balanceSupport.debit(income.getAccount(), income.getAmount());
        income.setDeleted(true);
        income.setUpdatedBy(FinanceTenantContext.userId().orElse(null));
        incomeRepository.save(income);
        auditSupport.log(
            FinanceAuditAction.DELETE,
            FinanceAuditEntityType.INCOME,
            income.getId(),
            "Удалён приход: " + income.getAmount(),
            null
        );
        LogUtil.info(IncomeServiceImpl.class, "Income soft-deleted: id={}", id);
    }
}
