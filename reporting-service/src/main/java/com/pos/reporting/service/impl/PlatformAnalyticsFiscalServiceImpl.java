package com.pos.reporting.service.impl;

import com.pos.reporting.dto.platform.PlatformAnalyticsFiscalResponse;
import com.pos.reporting.dto.platform.PlatformAnalyticsFiscalResponse.PlatformFiscalKpi;
import com.pos.reporting.dto.platform.PlatformAnalyticsFiscalResponse.PlatformFiscalStoreRow;
import com.pos.reporting.repository.PlatformAnalyticsOverviewRepository;
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
        Object[] totals = asRow(repository.fiscalTotals(range.from(), range.to()));

        BigDecimal turnover = moneyAt(totals, 0);
        long receipts = longAt(totals, 1);
        BigDecimal returnsAmount = moneyAt(totals, 2);
        long returnsReceipts = longAt(totals, 3);
        long cancelled = longAt(totals, 4);
        BigDecimal avgCheck = receipts > 0
            ? turnover.divide(BigDecimal.valueOf(receipts), 2, RoundingMode.HALF_UP)
            : BigDecimal.ZERO;

        List<PlatformFiscalStoreRow> byStore = repository.fiscalByStore(range.from(), range.to(), STORE_LIMIT).stream()
            .map(row -> new PlatformFiscalStoreRow(
                intAt(row, 0),
                str(row[1]),
                moneyAt(row, 2),
                longAt(row, 3),
                moneyAt(row, 4),
                longAt(row, 5)
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

    private static Object[] asRow(Object raw) {
        if (raw == null) {
            return new Object[0];
        }
        if (raw instanceof Object[] arr) {
            return arr;
        }
        return new Object[]{raw};
    }

    private static Integer intAt(Object[] row, int idx) {
        if (row == null || idx >= row.length || row[idx] == null) {
            return null;
        }
        return ((Number) row[idx]).intValue();
    }

    private static long longAt(Object[] row, int idx) {
        if (row == null || idx >= row.length || row[idx] == null) {
            return 0L;
        }
        return ((Number) row[idx]).longValue();
    }

    private static BigDecimal moneyAt(Object[] row, int idx) {
        if (row == null || idx >= row.length || row[idx] == null) {
            return BigDecimal.ZERO.setScale(2, RoundingMode.HALF_UP);
        }
        Object value = row[idx];
        if (value instanceof BigDecimal bd) {
            return bd.setScale(2, RoundingMode.HALF_UP);
        }
        return new BigDecimal(value.toString()).setScale(2, RoundingMode.HALF_UP);
    }

    private static String str(Object value) {
        return value == null ? "" : value.toString();
    }
}
