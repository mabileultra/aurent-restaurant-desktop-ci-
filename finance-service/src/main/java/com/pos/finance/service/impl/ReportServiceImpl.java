package com.pos.finance.service.impl;

import com.pos.finance.dto.report.CashFlowDailyDto;
import com.pos.finance.dto.report.CashFlowReportDto;
import com.pos.finance.dto.report.ProfitLossLineDto;
import com.pos.finance.dto.report.ProfitLossReportDto;
import com.pos.finance.entity.ExpenseSourceType;
import com.pos.finance.entity.LedgerEntryType;
import com.pos.finance.repository.AccountTransferRepository;
import com.pos.finance.repository.ExpenseRepository;
import com.pos.finance.repository.IncomeRepository;
import com.pos.finance.repository.SupplierPayableEntryRepository;
import com.pos.finance.security.FinanceTenantContext;
import com.pos.finance.service.ReportService;
import com.pos.finance.service.support.CashRegisterIncomeReader;
import com.pos.finance.service.support.CompanyBootstrapSupport;
import com.pos.finance.service.support.NetProfitCalculator;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class ReportServiceImpl implements ReportService {

    private final CashRegisterIncomeReader cashRegisterIncomeReader;
    private final ExpenseRepository expenseRepository;
    private final IncomeRepository incomeRepository;
    private final SupplierPayableEntryRepository payableRepository;
    private final AccountTransferRepository transferRepository;
    private final CompanyBootstrapSupport bootstrapSupport;

    @Override
    public ProfitLossReportDto profitLoss(LocalDate from, LocalDate to, Integer storeId) {
        Integer companyId = FinanceTenantContext.requireCompanyId();
        bootstrapSupport.ensureBootstrapped(companyId);
        LocalDate periodFrom = from != null ? from : LocalDate.now().withDayOfMonth(1);
        LocalDate periodTo = to != null ? to : LocalDate.now();

        BigDecimal totalIncome = cashRegisterIncomeReader.sumIncome(companyId, periodFrom, periodTo, storeId);
        BigDecimal totalExpense = expenseRepository.sumByPeriod(companyId, periodFrom, periodTo, storeId);
        BigDecimal purchaseCash = expenseRepository.sumBySourceAndPeriod(
            companyId, ExpenseSourceType.PURCHASE, periodFrom, periodTo, storeId
        );
        BigDecimal creditPurchase = payableRepository.sumChargesByPeriod(
            companyId, LedgerEntryType.CHARGE, periodFrom, periodTo, storeId
        );
        BigDecimal cogs = incomeRepository.sumCostByPeriod(companyId, periodFrom, periodTo, storeId);
        BigDecimal supplierPayments = expenseRepository.sumBySourceAndPeriod(
            companyId, ExpenseSourceType.SUPPLIER_PAYMENT, periodFrom, periodTo, storeId
        );
        BigDecimal grossProfit = cogs.signum() > 0
            ? totalIncome.subtract(cogs)
            : totalIncome.subtract(NetProfitCalculator.purchaseTotal(purchaseCash, creditPurchase));
        BigDecimal netProfit = NetProfitCalculator.calculate(
            totalIncome, totalExpense, purchaseCash, creditPurchase, cogs, supplierPayments
        );

        List<ProfitLossLineDto> expenseByCategory = expenseRepository
            .sumByCategory(companyId, periodFrom, periodTo, storeId).stream()
            .map(row -> new ProfitLossLineDto((String) row[0], (BigDecimal) row[1]))
            .toList();

        return new ProfitLossReportDto(
            periodFrom,
            periodTo,
            totalIncome,
            totalExpense,
            grossProfit,
            netProfit,
            List.of(new ProfitLossLineDto("Все доходы", totalIncome)),
            expenseByCategory
        );
    }

    @Override
    public CashFlowReportDto cashFlow(LocalDate from, LocalDate to, Integer storeId) {
        Integer companyId = FinanceTenantContext.requireCompanyId();
        bootstrapSupport.ensureBootstrapped(companyId);
        LocalDate periodFrom = from != null ? from : LocalDate.now().withDayOfMonth(1);
        LocalDate periodTo = to != null ? to : LocalDate.now();

        BigDecimal totalInflows = cashRegisterIncomeReader.sumIncome(companyId, periodFrom, periodTo, storeId);
        BigDecimal totalOutflows = expenseRepository.sumByPeriod(companyId, periodFrom, periodTo, storeId);
        BigDecimal totalTransfers = transferRepository.sumByPeriod(companyId, periodFrom, periodTo, storeId);

        Map<LocalDate, BigDecimal> inflowByDay = toDailyMap(
            cashRegisterIncomeReader.sumDailyIncome(companyId, periodFrom, periodTo, storeId)
        );
        Map<LocalDate, BigDecimal> outflowByDay = toDailyMap(
            expenseRepository.sumDailyByPeriod(companyId, periodFrom, periodTo, storeId)
        );

        List<CashFlowDailyDto> daily = new ArrayList<>();
        for (LocalDate day = periodFrom; !day.isAfter(periodTo); day = day.plusDays(1)) {
            BigDecimal inflows = inflowByDay.getOrDefault(day, BigDecimal.ZERO);
            BigDecimal outflows = outflowByDay.getOrDefault(day, BigDecimal.ZERO);
            daily.add(new CashFlowDailyDto(day, inflows, outflows, inflows.subtract(outflows)));
        }

        return new CashFlowReportDto(
            periodFrom,
            periodTo,
            totalInflows,
            totalOutflows,
            totalInflows.subtract(totalOutflows),
            totalTransfers,
            daily
        );
    }

    private static Map<LocalDate, BigDecimal> toDailyMap(List<Object[]> rows) {
        Map<LocalDate, BigDecimal> map = new HashMap<>();
        for (Object[] row : rows) {
            map.put((LocalDate) row[0], (BigDecimal) row[1]);
        }
        return map;
    }
}
