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
        Integer companyId = ReportingTenantContext.requireCompanyId();
        BigDecimal totalRevenue = nz(saleFactRepository.sumTotalByCompanyAndDateRange(companyId, from, to));
        long transactionCount = saleFactRepository.countByCompanyIdAndTransactionDateBetween(companyId, from, to);
        long totalItemsSold = saleFactRepository.sumItemsSoldByCompanyAndDateRange(companyId, from, to);
        BigDecimal averageTransactionValue = transactionCount > 0
            ? totalRevenue.divide(BigDecimal.valueOf(transactionCount), 2, RoundingMode.HALF_UP)
            : BigDecimal.ZERO;
        BigDecimal totalCostEstimate = nz(
            saleItemFactRepository.sumCostEstimateByCompanyAndDateRange(companyId, from, to)
        );
        BigDecimal grossProfit = totalRevenue.subtract(totalCostEstimate);
        List<DailyPoint> dailyBreakdown = saleFactRepository.dailyRevenueByCompanyAndDateRange(companyId, from, to)
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
            dailyBreakdown
        );
    }

    private static BigDecimal nz(BigDecimal value) {
        return value != null ? value : BigDecimal.ZERO;
    }
}
