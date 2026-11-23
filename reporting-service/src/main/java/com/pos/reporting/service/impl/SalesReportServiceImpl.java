package com.pos.reporting.service.impl;

import com.pos.reporting.service.SalesReportService;

import com.pos.reporting.dto.DailyPoint;
import com.pos.reporting.dto.SalesReportResponse;
import com.pos.reporting.repository.SaleFactRepository;
import com.pos.reporting.repository.SaleItemFactRepository;
import com.pos.reporting.security.ReportingTenantContext;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class SalesReportServiceImpl implements SalesReportService {

    private final SaleFactRepository saleFactRepository;
    private final SaleItemFactRepository saleItemFactRepository;

    @Override
    public SalesReportResponse salesReport(LocalDate from, LocalDate to) {
        return salesReport(from, to, null);
    }

    @Override
    public SalesReportResponse salesReport(LocalDate from, LocalDate to, Integer storeId) {
        Integer companyId = ReportingTenantContext.requireCompanyId();
        BigDecimal totalRevenue = nz(
            saleFactRepository.sumTotalByCompanyDateRangeAndStore(companyId, from, to, storeId)
        );
        long transactionCount = saleFactRepository.countByCompanyDateRangeAndStore(
            companyId, from, to, storeId
        );
        long totalItemsSold = saleFactRepository.sumItemsSoldByCompanyDateRangeAndStore(
            companyId, from, to, storeId
        );
        BigDecimal averageTransactionValue = transactionCount > 0
            ? totalRevenue.divide(BigDecimal.valueOf(transactionCount), 2, RoundingMode.HALF_UP)
            : BigDecimal.ZERO;
        BigDecimal totalCostEstimate = nz(
            saleItemFactRepository.sumCostEstimateByCompanyDateRangeAndStore(
                companyId, from, to, storeId
            )
        );
        BigDecimal grossProfit = totalRevenue.subtract(totalCostEstimate);
        BigDecimal cashTotal = nz(
            saleFactRepository.sumCashByCompanyDateRangeAndStore(companyId, from, to, storeId)
        );
        BigDecimal cardTotal = nz(
            saleFactRepository.sumCardByCompanyDateRangeAndStore(companyId, from, to, storeId)
        );
        List<DailyPoint> dailyBreakdown = saleFactRepository
            .dailyRevenueByCompanyDateRangeAndStore(companyId, from, to, storeId)
            .stream()
            .map(row -> new DailyPoint(
                ((LocalDate) row[0]).toString(),
                (BigDecimal) row[1]
            ))
            .toList();
        return new SalesReportResponse(
            totalRevenue,
            transactionCount,
            totalItemsSold,
            averageTransactionValue,
            totalCostEstimate,
            grossProfit,
            cashTotal,
            cardTotal,
            dailyBreakdown
        );
    }

    private static BigDecimal nz(BigDecimal value) {
        return value != null ? value : BigDecimal.ZERO;
    }
}
