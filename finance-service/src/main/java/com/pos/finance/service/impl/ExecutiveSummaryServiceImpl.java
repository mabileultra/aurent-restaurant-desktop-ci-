package com.pos.finance.service.impl;

import com.pos.finance.dto.executive.ExecutiveChartDayDto;
import com.pos.finance.dto.executive.ExecutiveComparisonDto;
import com.pos.finance.dto.executive.ExecutiveExpenseItemDto;
import com.pos.finance.dto.executive.ExecutivePeriod;
import com.pos.finance.dto.executive.ExecutivePreviousPeriodDto;
import com.pos.finance.dto.executive.ExecutiveSummaryDto;
import com.pos.finance.entity.AccountType;
import com.pos.finance.entity.FinancialAccount;
import com.pos.finance.entity.IncomeSourceType;
import com.pos.finance.repository.CustomerReceivableEntryRepository;
import com.pos.finance.repository.ExpenseRepository;
import com.pos.finance.repository.FinancialAccountRepository;
import com.pos.finance.repository.IncomeRepository;
import com.pos.finance.repository.SupplierPayableEntryRepository;
import com.pos.finance.security.FinanceTenantContext;
import com.pos.finance.service.ExecutiveSummaryService;
import com.pos.finance.service.support.CompanyBootstrapSupport;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.time.ZoneOffset;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class ExecutiveSummaryServiceImpl implements ExecutiveSummaryService {

    private final IncomeRepository incomeRepository;
    private final ExpenseRepository expenseRepository;
    private final FinancialAccountRepository accountRepository;
    private final CustomerReceivableEntryRepository receivableRepository;
    private final SupplierPayableEntryRepository payableRepository;
    private final CompanyBootstrapSupport bootstrapSupport;

    @Override
    public ExecutiveSummaryDto getSummary(ExecutivePeriod period, Integer storeId) {
        Integer companyId = FinanceTenantContext.requireCompanyId();
        bootstrapSupport.ensureBootstrapped(companyId);

        LocalDate today = LocalDate.now();
        LocalDate yesterday = today.minusDays(1);
        PeriodRange range = resolveRange(period, today);

        BigDecimal salesToday = sumSales(companyId, today, today, storeId);
        long salesCountToday = countSales(companyId, today, today, storeId);
        BigDecimal revenueToday = incomeRepository.sumByPeriod(companyId, today, today, storeId);
        BigDecimal expensesToday = expenseRepository.sumByPeriod(companyId, today, today, storeId);
        BigDecimal netProfitToday = revenueToday.subtract(expensesToday);

        BigDecimal revenuePeriod = incomeRepository.sumByPeriod(companyId, range.from(), range.to(), storeId);
        BigDecimal expensesPeriod = expenseRepository.sumByPeriod(companyId, range.from(), range.to(), storeId);
        BigDecimal netProfitPeriod = revenuePeriod.subtract(expensesPeriod);

        BigDecimal salesYesterday = sumSales(companyId, yesterday, yesterday, storeId);
        BigDecimal revenueYesterday = incomeRepository.sumByPeriod(companyId, yesterday, yesterday, storeId);
        BigDecimal expensesYesterday = expenseRepository.sumByPeriod(companyId, yesterday, yesterday, storeId);
        BigDecimal netProfitYesterday = revenueYesterday.subtract(expensesYesterday);

        PeriodRange previousRange = previousRange(period, today);
        BigDecimal salesPrevious = sumSales(companyId, previousRange.from(), previousRange.to(), storeId);
        long salesCountPrevious = countSales(companyId, previousRange.from(), previousRange.to(), storeId);
        BigDecimal revenuePrevious = incomeRepository.sumByPeriod(
            companyId, previousRange.from(), previousRange.to(), storeId
        );
        BigDecimal expensesPrevious = expenseRepository.sumByPeriod(
            companyId, previousRange.from(), previousRange.to(), storeId
        );
        BigDecimal netProfitPrevious = revenuePrevious.subtract(expensesPrevious);

        BigDecimal periodSalesAmount = sumSales(companyId, range.from(), range.to(), storeId);
        long periodSalesCount = countSales(companyId, range.from(), range.to(), storeId);
        BigDecimal averageCheck = averageCheck(periodSalesAmount, periodSalesCount);
        ExecutivePreviousPeriodDto previousPeriod = new ExecutivePreviousPeriodDto(
            revenuePrevious,
            expensesPrevious,
            netProfitPrevious,
            salesPrevious,
            salesCountPrevious
        );

        ExecutiveComparisonDto comparison = period == ExecutivePeriod.TODAY
            ? new ExecutiveComparisonDto(
                percentChange(salesToday, salesYesterday),
                percentChange(netProfitToday, netProfitYesterday),
                percentChange(expensesToday, expensesYesterday)
            )
            : new ExecutiveComparisonDto(
                percentChange(sumSales(companyId, range.from(), range.to(), storeId), salesPrevious),
                percentChange(netProfitPeriod, netProfitPrevious),
                percentChange(expensesPeriod, expensesPrevious)
            );

        List<FinancialAccount> accounts = accountRepository.findByCompanyIdAndDeletedFalseOrderByNameAsc(companyId);
        BigDecimal cashTotal = accounts.stream()
            .filter(a -> a.getType() == AccountType.CASH)
            .filter(a -> storeId == null || storeId.equals(a.getStoreId()))
            .map(FinancialAccount::getBalance)
            .reduce(BigDecimal.ZERO, BigDecimal::add);
        BigDecimal bankTotal = accounts.stream()
            .filter(a -> a.getType() == AccountType.BANK || a.getType() == AccountType.CARD)
            .map(FinancialAccount::getBalance)
            .reduce(BigDecimal.ZERO, BigDecimal::add);

        List<ExecutiveExpenseItemDto> topExpenses = expenseRepository
            .sumByCategory(companyId, today, today, storeId).stream()
            .limit(5)
            .map(row -> new ExecutiveExpenseItemDto((String) row[0], (BigDecimal) row[1]))
            .toList();

        return new ExecutiveSummaryDto(
            period,
            salesToday,
            salesCountToday,
            revenueToday,
            expensesToday,
            netProfitToday,
            revenuePeriod,
            expensesPeriod,
            netProfitPeriod,
            cashTotal,
            bankTotal,
            cashTotal.add(bankTotal),
            sumDebtBalances(receivableRepository.sumBalancesByCustomer(companyId)),
            sumDebtBalances(payableRepository.sumBalancesBySupplier(companyId)),
            comparison,
            buildChart(companyId, storeId, range.chartFrom(), range.chartTo()),
            expensesToday,
            topExpenses,
            periodSalesAmount,
            periodSalesCount,
            averageCheck,
            previousPeriod,
            OffsetDateTime.now(ZoneOffset.UTC)
        );
    }

    private BigDecimal averageCheck(BigDecimal salesAmount, long salesCount) {
        if (salesCount <= 0) {
            return BigDecimal.ZERO;
        }
        return salesAmount.divide(BigDecimal.valueOf(salesCount), 0, RoundingMode.HALF_UP);
    }

    private List<ExecutiveChartDayDto> buildChart(
        Integer companyId,
        Integer storeId,
        LocalDate from,
        LocalDate to
    ) {
        Map<LocalDate, BigDecimal> incomeByDay = new HashMap<>();
        for (Object[] row : incomeRepository.sumDailyByPeriod(companyId, from, to, storeId)) {
            incomeByDay.put((LocalDate) row[0], (BigDecimal) row[1]);
        }
        Map<LocalDate, BigDecimal> expenseByDay = new HashMap<>();
        for (Object[] row : expenseRepository.sumDailyByPeriod(companyId, from, to, storeId)) {
            expenseByDay.put((LocalDate) row[0], (BigDecimal) row[1]);
        }

        List<ExecutiveChartDayDto> days = new ArrayList<>();
        for (LocalDate day = from; !day.isAfter(to); day = day.plusDays(1)) {
            BigDecimal income = incomeByDay.getOrDefault(day, BigDecimal.ZERO);
            BigDecimal expense = expenseByDay.getOrDefault(day, BigDecimal.ZERO);
            days.add(new ExecutiveChartDayDto(day, income, expense, income.subtract(expense)));
        }
        return days;
    }

    private BigDecimal sumSales(Integer companyId, LocalDate from, LocalDate to, Integer storeId) {
        BigDecimal zReport = incomeRepository.sumBySourceAndPeriod(
            companyId, IncomeSourceType.Z_REPORT, from, to, storeId
        );
        BigDecimal legacySale = incomeRepository.sumBySourceAndPeriod(
            companyId, IncomeSourceType.SALE, from, to, storeId
        );
        return zReport.add(legacySale);
    }

    private long countSales(Integer companyId, LocalDate from, LocalDate to, Integer storeId) {
        return incomeRepository.countBySourceAndPeriod(companyId, IncomeSourceType.Z_REPORT, from, to, storeId)
            + incomeRepository.countBySourceAndPeriod(companyId, IncomeSourceType.SALE, from, to, storeId);
    }

    private BigDecimal percentChange(BigDecimal current, BigDecimal previous) {
        if (previous == null || previous.compareTo(BigDecimal.ZERO) == 0) {
            return current.compareTo(BigDecimal.ZERO) > 0 ? BigDecimal.valueOf(100) : BigDecimal.ZERO;
        }
        return current.subtract(previous)
            .multiply(BigDecimal.valueOf(100))
            .divide(previous, 1, RoundingMode.HALF_UP);
    }

    private PeriodRange resolveRange(ExecutivePeriod period, LocalDate today) {
        return switch (period) {
            case TODAY -> new PeriodRange(today, today, today.minusDays(6), today);
            case WEEK -> {
                LocalDate weekStart = today.minusDays(6);
                yield new PeriodRange(weekStart, today, weekStart, today);
            }
            case MONTH -> {
                LocalDate monthStart = today.withDayOfMonth(1);
                yield new PeriodRange(monthStart, today, monthStart, today);
            }
        };
    }

    private PeriodRange previousRange(ExecutivePeriod period, LocalDate today) {
        return switch (period) {
            case TODAY -> new PeriodRange(today.minusDays(1), today.minusDays(1), today.minusDays(1), today.minusDays(1));
            case WEEK -> {
                LocalDate prevEnd = today.minusDays(7);
                LocalDate prevStart = prevEnd.minusDays(6);
                yield new PeriodRange(prevStart, prevEnd, prevStart, prevEnd);
            }
            case MONTH -> {
                LocalDate prevMonthEnd = today.withDayOfMonth(1).minusDays(1);
                LocalDate prevMonthStart = prevMonthEnd.withDayOfMonth(1);
                yield new PeriodRange(prevMonthStart, prevMonthEnd, prevMonthStart, prevMonthEnd);
            }
        };
    }

    private BigDecimal sumDebtBalances(List<Object[]> rows) {
        return rows.stream()
            .map(row -> (BigDecimal) row[2])
            .reduce(BigDecimal.ZERO, BigDecimal::add);
    }

    private record PeriodRange(LocalDate from, LocalDate to, LocalDate chartFrom, LocalDate chartTo) {
    }
}
