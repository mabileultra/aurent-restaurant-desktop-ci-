package com.pos.finance.service.support;

import com.pos.finance.entity.IncomeSourceType;
import com.pos.finance.repository.IncomeRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

@Component
@RequiredArgsConstructor
public class CashRegisterIncomeReader {

    private final IncomeRepository incomeRepository;
    private final CashRegisterIncomePolicy incomePolicy;

    public boolean prefersSaleLedger(Integer companyId) {
        return incomePolicy.prefersSaleLedger(companyId);
    }

    public BigDecimal sumRegisterRevenue(Integer companyId, LocalDate from, LocalDate to, Integer storeId) {
        return incomeRepository.sumBySourceAndPeriod(
            companyId,
            incomePolicy.registerSource(companyId),
            from,
            to,
            storeId
        );
    }

    public long countRegisterReceipts(Integer companyId, LocalDate from, LocalDate to, Integer storeId) {
        if (incomePolicy.prefersSaleLedger(companyId)) {
            return incomeRepository.countDistinctSourceIdBySourceAndPeriod(
                companyId,
                IncomeSourceType.SALE,
                from,
                to,
                storeId
            );
        }
        return incomeRepository.countDistinctZReportGroups(companyId, from, to, storeId);
    }

    public BigDecimal sumIncome(Integer companyId, LocalDate from, LocalDate to, Integer storeId) {
        if (incomePolicy.prefersSaleLedger(companyId)) {
            return incomeRepository.sumByPeriodExcludingSource(
                companyId,
                IncomeSourceType.Z_REPORT,
                from,
                to,
                storeId
            );
        }
        return incomeRepository.sumByPeriod(companyId, from, to, storeId);
    }

    public List<Object[]> sumDailyIncome(Integer companyId, LocalDate from, LocalDate to, Integer storeId) {
        if (incomePolicy.prefersSaleLedger(companyId)) {
            return incomeRepository.sumDailyByPeriodExcludingSource(
                companyId,
                IncomeSourceType.Z_REPORT,
                from,
                to,
                storeId
            );
        }
        return incomeRepository.sumDailyByPeriod(companyId, from, to, storeId);
    }

    public List<Object[]> sumDailyRegisterRevenue(Integer companyId, LocalDate from, LocalDate to, Integer storeId) {
        if (incomePolicy.prefersSaleLedger(companyId)) {
            return incomeRepository.sumDailyRevenueBySource(
                companyId,
                IncomeSourceType.SALE,
                from,
                to,
                storeId
            );
        }
        return incomeRepository.sumDailyRevenue(companyId, from, to, storeId);
    }
}
