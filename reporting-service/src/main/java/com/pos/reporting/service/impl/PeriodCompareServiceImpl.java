package com.pos.reporting.service.impl;

import com.pos.reporting.service.PeriodCompareService;

import com.pos.reporting.dto.PeriodCompareResponse;
import com.pos.reporting.repository.SaleFactRepository;
import com.pos.reporting.security.ReportingTenantContext;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.temporal.ChronoUnit;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class PeriodCompareServiceImpl implements PeriodCompareService {

    private final SaleFactRepository saleFactRepository;

    @Override
    public PeriodCompareResponse compare(LocalDate from, LocalDate to, Integer storeId) {
        LocalDate end = to != null ? to : LocalDate.now();
        LocalDate start = from != null ? from : end.minusDays(6);
        long days = ChronoUnit.DAYS.between(start, end) + 1;
        LocalDate prevEnd = start.minusDays(1);
        LocalDate prevStart = prevEnd.minusDays(days - 1);

        Integer companyId = ReportingTenantContext.requireCompanyId();
        PeriodCompareResponse.PeriodMetrics current = loadMetrics(companyId, start, end, storeId);
        PeriodCompareResponse.PeriodMetrics previous = loadMetrics(companyId, prevStart, prevEnd, storeId);

        return new PeriodCompareResponse(
            start,
            end,
            prevStart,
            prevEnd,
            current,
            previous,
            buildDeltas(current, previous)
        );
    }

    private PeriodCompareResponse.PeriodMetrics loadMetrics(
        Integer companyId,
        LocalDate from,
        LocalDate to,
        Integer storeId
    ) {
        BigDecimal revenue = nz(saleFactRepository.sumTotalByCompanyDateRangeAndStore(companyId, from, to, storeId));
        long receipts = saleFactRepository.countByCompanyDateRangeAndStore(companyId, from, to, storeId);
        long items = saleFactRepository.sumItemsSoldByCompanyDateRangeAndStore(companyId, from, to, storeId);
        return new PeriodCompareResponse.PeriodMetrics(revenue, receipts, items);
    }

    private static PeriodCompareResponse.PeriodDeltas buildDeltas(
        PeriodCompareResponse.PeriodMetrics current,
        PeriodCompareResponse.PeriodMetrics previous
    ) {
        BigDecimal revDelta = current.revenue().subtract(previous.revenue());
        long receiptDelta = current.receiptCount() - previous.receiptCount();
        long itemsDelta = current.itemsSold() - previous.itemsSold();
        return new PeriodCompareResponse.PeriodDeltas(
            revDelta,
            percentChange(previous.revenue(), current.revenue()),
            receiptDelta,
            percentChangeLong(previous.receiptCount(), current.receiptCount()),
            itemsDelta,
            percentChangeLong(previous.itemsSold(), current.itemsSold())
        );
    }

    private static BigDecimal percentChange(BigDecimal base, BigDecimal value) {
        if (base == null || base.compareTo(BigDecimal.ZERO) == 0) {
            return value != null && value.compareTo(BigDecimal.ZERO) > 0
                ? BigDecimal.valueOf(100)
                : BigDecimal.ZERO;
        }
        return value.subtract(base)
            .multiply(BigDecimal.valueOf(100))
            .divide(base, 2, RoundingMode.HALF_UP);
    }

    private static BigDecimal percentChangeLong(long base, long value) {
        return percentChange(BigDecimal.valueOf(base), BigDecimal.valueOf(value));
    }

    private static BigDecimal nz(BigDecimal value) {
        return value != null ? value : BigDecimal.ZERO;
    }
}
