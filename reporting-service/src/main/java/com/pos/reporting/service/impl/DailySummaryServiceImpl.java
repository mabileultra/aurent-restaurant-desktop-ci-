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
    public DailySummaryResponse dailySummary(LocalDate date, Integer storeId) {
        Integer companyId = ReportingTenantContext.requireCompanyId();
        LocalDate reportDate = date != null ? date : LocalDate.now();
        BigDecimal totalRevenue = nz(saleFactRepository.sumTotalByCompanyDateRangeAndStore(
            companyId, reportDate, reportDate, storeId
        ));
        long transactionCount = saleFactRepository.countByCompanyDateRangeAndStore(
            companyId, reportDate, reportDate, storeId
        );
        long itemsSold = saleFactRepository.sumItemsSoldByCompanyDateRangeAndStore(
            companyId, reportDate, reportDate, storeId
        );
        BigDecimal totalCostEstimate = nz(saleItemFactRepository.sumCostEstimateByCompanyDateRangeAndStore(
            companyId, reportDate, reportDate, storeId
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
