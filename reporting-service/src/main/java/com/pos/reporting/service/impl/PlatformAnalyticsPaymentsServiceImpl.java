package com.pos.reporting.service.impl;

import com.pos.reporting.dto.platform.PlatformAnalyticsPaymentsResponse;
import com.pos.reporting.dto.platform.PlatformAnalyticsPaymentsResponse.PlatformPaymentDailyRow;
import com.pos.reporting.dto.platform.PlatformAnalyticsPaymentsResponse.PlatformPaymentMethodRow;
import com.pos.reporting.repository.PlatformAnalyticsOverviewRepository;
import com.pos.reporting.util.NativeAggregateRowSupport;
import com.pos.reporting.service.PlatformAnalyticsPaymentsService;
import com.pos.reporting.service.PlatformAnalyticsPeriod;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class PlatformAnalyticsPaymentsServiceImpl implements PlatformAnalyticsPaymentsService {

    private static final DateTimeFormatter DAY_LABEL = DateTimeFormatter.ofPattern("dd.MM");

    private final PlatformAnalyticsOverviewRepository repository;

    @Override
    public PlatformAnalyticsPaymentsResponse payments(String period, LocalDate from, LocalDate to) {
        PlatformAnalyticsPeriod range = PlatformAnalyticsPeriod.resolve(period, from, to, LocalDate.now());

        Map<String, PlatformPaymentMethodRow> methods = new LinkedHashMap<>();
        BigDecimal totalAmount = BigDecimal.ZERO;
        long totalReceipts = 0L;

        for (Object[] row : repository.paymentsByMethod(range.from(), range.to())) {
            String raw = str(row[0]);
            String id = normalizeMethodId(raw);
            BigDecimal amount = NativeAggregateRowSupport.toBigDecimal(row, 1);
            long receipts = NativeAggregateRowSupport.toLong(row, 2);
            totalAmount = totalAmount.add(amount);
            totalReceipts += receipts;
            methods.merge(id, new PlatformPaymentMethodRow(id, id, amount, receipts, BigDecimal.ZERO), (a, b) ->
                new PlatformPaymentMethodRow(
                    a.id(),
                    a.id(),
                    a.amount().add(b.amount()),
                    a.receipts() + b.receipts(),
                    BigDecimal.ZERO
                ));
        }

        BigDecimal base = totalAmount;
        List<PlatformPaymentMethodRow> methodRows = methods.values().stream()
            .map(m -> new PlatformPaymentMethodRow(
                m.id(),
                m.id(),
                m.amount(),
                m.receipts(),
                share(m.amount(), base)
            ))
            .sorted((a, b) -> b.amount().compareTo(a.amount()))
            .toList();

        Map<LocalDate, Object[]> dailyMap = new LinkedHashMap<>();
        for (Object[] row : repository.paymentsDailySplit(range.from(), range.to())) {
            dailyMap.put(toDate(row[0]), row);
        }
        List<PlatformPaymentDailyRow> daily = new ArrayList<>();
        for (LocalDate day = range.from(); !day.isAfter(range.to()); day = day.plusDays(1)) {
            Object[] row = dailyMap.get(day);
            daily.add(new PlatformPaymentDailyRow(
                day.toString(),
                day.format(DAY_LABEL),
                row != null ? NativeAggregateRowSupport.toBigDecimal(row, 1) : BigDecimal.ZERO,
                row != null ? NativeAggregateRowSupport.toBigDecimal(row, 2) : BigDecimal.ZERO,
                row != null ? NativeAggregateRowSupport.toBigDecimal(row, 3) : BigDecimal.ZERO
            ));
        }

        return new PlatformAnalyticsPaymentsResponse(
            range.key(),
            range.from().toString(),
            range.to().toString(),
            false,
            totalAmount,
            totalReceipts,
            methodRows,
            daily
        );
    }

    public static String normalizeMethodId(String raw) {
        String v = raw == null ? "unknown" : raw.trim().toLowerCase(Locale.ROOT);
        if (v.isEmpty() || "unknown".equals(v) || "null".equals(v)) {
            return "other";
        }
        if (v.contains("cash") || v.contains("налич") || "nal".equals(v)) {
            return "cash";
        }
        if (v.contains("card") || v.contains("карт") || v.contains("uzcard") || v.contains("humo") || v.contains("bank")) {
            return "card";
        }
        if (v.contains("click")) {
            return "click";
        }
        if (v.contains("payme") || v.contains("paymee")) {
            return "payme";
        }
        if (v.contains("transfer") || v.contains("перевод")) {
            return "transfer";
        }
        if (v.contains("mix") || v.contains("смеш")) {
            return "mixed";
        }
        return v.length() > 24 ? v.substring(0, 24) : v;
    }

    private static BigDecimal share(BigDecimal part, BigDecimal total) {
        if (total == null || total.signum() == 0) {
            return BigDecimal.ZERO.setScale(1, RoundingMode.HALF_UP);
        }
        return part.multiply(BigDecimal.valueOf(100)).divide(total, 1, RoundingMode.HALF_UP);
    }

    private static String str(Object value) {
        return value == null ? "" : value.toString();
    }

    private static LocalDate toDate(Object value) {
        if (value instanceof LocalDate d) {
            return d;
        }
        if (value instanceof java.sql.Date d) {
            return d.toLocalDate();
        }
        return LocalDate.parse(value.toString());
    }
}
