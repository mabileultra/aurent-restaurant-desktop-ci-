package com.pos.reporting.service.impl;

import com.pos.reporting.service.DailySummaryService;

import com.pos.reporting.dto.DailySummaryResponse;
import com.pos.reporting.repository.SaleFactRepository;
import com.pos.reporting.repository.SaleItemFactRepository;
import com.pos.reporting.security.ReportingTenantContext;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class DailySummaryServiceImpl implements DailySummaryService {

    private final SaleFactRepository saleFactRepository;
    private final SaleItemFactRepository saleItemFactRepository;

    @Override
    public DailySummaryResponse dailySummary(LocalDate date) {
        Integer companyId = ReportingTenantContext.requireCompanyId();
        LocalDate reportDate = date != null ? date : LocalDate.now();
        BigDecimal totalRevenue = nz(saleFactRepository.sumTotalByCompanyAndDateRange(
            companyId, reportDate, reportDate
        ));
        long transactionCount = saleFactRepository.countByCompanyIdAndTransactionDateBetween(
            companyId, reportDate, reportDate
        );
        long itemsSold = saleFactRepository.sumItemsSoldByCompanyAndDateRange(
            companyId, reportDate, reportDate
        );
        BigDecimal totalCostEstimate = nz(saleItemFactRepository.sumCostEstimateByCompanyAndDateRange(
            companyId, reportDate, reportDate
        ));
        BigDecimal grossProfit = totalRevenue.subtract(totalCostEstimate);
        return new DailySummaryResponse(
            totalRevenue,
            transactionCount,
            itemsSold,
            totalCostEstimate,
            grossProfit
        );
    }

    private static BigDecimal nz(BigDecimal value) {
        return value != null ? value : BigDecimal.ZERO;
    }
}
