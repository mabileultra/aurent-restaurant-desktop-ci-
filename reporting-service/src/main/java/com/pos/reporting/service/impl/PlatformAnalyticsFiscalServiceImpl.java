package com.pos.reporting.service.impl;

import com.pos.reporting.dto.platform.PlatformAnalyticsFiscalResponse;
import com.pos.reporting.dto.platform.PlatformAnalyticsFiscalResponse.PlatformFiscalKpi;
import com.pos.reporting.dto.platform.PlatformAnalyticsFiscalResponse.PlatformFiscalStoreRow;
import com.pos.reporting.repository.PlatformAnalyticsOverviewRepository;
import com.pos.reporting.util.NativeAggregateRowSupport;
import com.pos.reporting.service.PlatformAnalyticsFiscalService;
import com.pos.reporting.service.PlatformAnalyticsPeriod;
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
public class PlatformAnalyticsFiscalServiceImpl implements PlatformAnalyticsFiscalService {

    private static final int STORE_LIMIT = 100;

    private final PlatformAnalyticsOverviewRepository repository;

    @Override
    public PlatformAnalyticsFiscalResponse fiscal(String period, LocalDate from, LocalDate to) {
        PlatformAnalyticsPeriod range = PlatformAnalyticsPeriod.resolve(period, from, to, LocalDate.now());
        Object[] totals = NativeAggregateRowSupport.normalize(repository.fiscalTotals(range.from(), range.to()));

        BigDecimal turnover = NativeAggregateRowSupport.toBigDecimal(totals, 0);
        long receipts = NativeAggregateRowSupport.toLong(totals, 1);
        BigDecimal returnsAmount = NativeAggregateRowSupport.toBigDecimal(totals, 2);
        long returnsReceipts = NativeAggregateRowSupport.toLong(totals, 3);
        long cancelled = NativeAggregateRowSupport.toLong(totals, 4);
        BigDecimal avgCheck = receipts > 0
            ? turnover.divide(BigDecimal.valueOf(receipts), 2, RoundingMode.HALF_UP)
            : BigDecimal.ZERO;

        List<PlatformFiscalStoreRow> byStore = repository.fiscalByStore(range.from(), range.to(), STORE_LIMIT).stream()
            .map(row -> new PlatformFiscalStoreRow(
                NativeAggregateRowSupport.toInteger(row, 0),
                str(row[1]),
                NativeAggregateRowSupport.toBigDecimal(row, 2),
                NativeAggregateRowSupport.toLong(row, 3),
                NativeAggregateRowSupport.toBigDecimal(row, 4),
                NativeAggregateRowSupport.toLong(row, 5)
            ))
            .toList();

        return new PlatformAnalyticsFiscalResponse(
            range.key(),
            range.from().toString(),
            range.to().toString(),
            false,
            true,
            new PlatformFiscalKpi(
                turnover,
                receipts,
                avgCheck,
                returnsAmount,
                returnsReceipts,
                cancelled,
                BigDecimal.ZERO,
                BigDecimal.ZERO,
                false
            ),
            byStore
        );
    }

    private static String str(Object value) {
        return value == null ? "" : value.toString();
    }
}
