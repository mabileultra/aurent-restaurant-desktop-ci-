package com.pos.platform.service.impl;

import com.pos.platform.domain.BillingLedgerType;
import com.pos.platform.domain.BillingPaymentMethod;
import com.pos.platform.dto.billing.BillingCalendarResponse;
import com.pos.platform.dto.billing.BillingReportsResponse;
import com.pos.platform.dto.billing.CompanyPaymentRowResponse;
import com.pos.platform.entity.BillingLedgerEntry;
import com.pos.platform.repository.BillingLedgerRepository;
import com.pos.platform.service.BillingCollectionsService;
import com.pos.platform.service.BillingReportsService;
import com.pos.platform.service.support.BillingChargeProjection;
import com.pos.platform.service.support.BillingChargeProjection.ProjectedCharge;
import com.pos.platform.service.support.BillingTime;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.DayOfWeek;
import java.time.Instant;
import java.time.LocalDate;
import java.time.YearMonth;
import java.time.temporal.TemporalAdjusters;
import java.util.ArrayList;
import java.util.EnumMap;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.function.Predicate;

@Service
@RequiredArgsConstructor
public class BillingReportsServiceImpl implements BillingReportsService {

    private final BillingCollectionsService collectionsService;
    private final BillingLedgerRepository ledgerRepository;
    private final BillingChargeProjection projection;

    @Override
    @Transactional(readOnly = true)
    public BillingReportsResponse reports(Period methodsPeriod) {
        LocalDate today = LocalDate.now(BillingTime.ZONE);
        LocalDate yearStart = today.withDayOfYear(1);
        List<BillingLedgerEntry> payments = ledgerRepository.findByEntryTypeAndCreatedAtGreaterThanEqual(
            BillingLedgerType.TOP_UP, BillingTime.startOfDay(yearStart));

        BillingReportsResponse.Revenue revenue = new BillingReportsResponse.Revenue(
            sum(payments, since(start(Period.DAY, today))),
            sum(payments, since(start(Period.WEEK, today))),
            sum(payments, since(start(Period.MONTH, today))),
            sum(payments, since(start(Period.YEAR, today)))
        );

        List<CompanyPaymentRowResponse> rows = collectionsService.list(BillingCollectionsService.Filter.all());
        List<ProjectedCharge> next30 = projection.project(rows, today, today.plusDays(29));
        BillingReportsResponse.Expected expected = new BillingReportsResponse.Expected(
            sumCharges(next30, today, today),
            countCharges(next30, today, today),
            sumCharges(next30, today, today.plusDays(6)),
            countCharges(next30, today, today.plusDays(6)),
            sumCharges(next30, today, today.plusDays(29)),
            next30.size()
        );

        Period period = methodsPeriod != null ? methodsPeriod : Period.MONTH;
        return new BillingReportsResponse(
            revenue,
            expected,
            debt(rows),
            period.name(),
            methods(payments, since(start(period, today)))
        );
    }

    @Override
    @Transactional(readOnly = true)
    public BillingCalendarResponse calendar(YearMonth month) {
        YearMonth ym = month != null ? month : YearMonth.now(BillingTime.ZONE);
        List<CompanyPaymentRowResponse> rows = collectionsService.list(BillingCollectionsService.Filter.all());
        Map<LocalDate, List<ProjectedCharge>> byDay = new LinkedHashMap<>();
        for (ProjectedCharge c : projection.project(rows, ym.atDay(1), ym.atEndOfMonth())) {
            byDay.computeIfAbsent(c.date(), d -> new ArrayList<>()).add(c);
        }
        List<BillingCalendarResponse.Day> days = byDay.entrySet().stream()
            .map(e -> new BillingCalendarResponse.Day(
                e.getKey(),
                e.getValue().size(),
                e.getValue().stream().map(ProjectedCharge::amount).reduce(BigDecimal.ZERO, BigDecimal::add),
                e.getValue().stream()
                    .map(c -> new BillingCalendarResponse.Item(
                        c.row().billing().companyId(),
                        c.row().billing().companyName(),
                        c.amount(),
                        c.row().paymentState()
                    ))
                    .toList()
            ))
            .toList();
        return new BillingCalendarResponse(
            ym.toString(),
            days.stream().map(BillingCalendarResponse.Day::amount).reduce(BigDecimal.ZERO, BigDecimal::add),
            days.stream().mapToLong(BillingCalendarResponse.Day::count).sum(),
            days
        );
    }

    private static LocalDate start(Period period, LocalDate today) {
        return switch (period) {
            case DAY -> today;
            case WEEK -> today.with(TemporalAdjusters.previousOrSame(DayOfWeek.MONDAY));
            case MONTH -> today.withDayOfMonth(1);
            case YEAR -> today.withDayOfYear(1);
        };
    }

    private static Predicate<BillingLedgerEntry> since(LocalDate day) {
        Instant from = BillingTime.startOfDay(day);
        return e -> e.getCreatedAt() != null && !e.getCreatedAt().isBefore(from);
    }

    private static BigDecimal sum(List<BillingLedgerEntry> entries, Predicate<BillingLedgerEntry> filter) {
        return entries.stream().filter(filter).map(BillingLedgerEntry::getAmount).reduce(BigDecimal.ZERO, BigDecimal::add);
    }

    private static BigDecimal sumCharges(List<ProjectedCharge> charges, LocalDate from, LocalDate to) {
        return charges.stream()
            .filter(c -> !c.date().isBefore(from) && !c.date().isAfter(to))
            .map(ProjectedCharge::amount)
            .reduce(BigDecimal.ZERO, BigDecimal::add);
    }

    private static long countCharges(List<ProjectedCharge> charges, LocalDate from, LocalDate to) {
        return charges.stream().filter(c -> !c.date().isBefore(from) && !c.date().isAfter(to)).count();
    }

    private static BillingReportsResponse.Debt debt(List<CompanyPaymentRowResponse> rows) {
        List<BigDecimal> debts = rows.stream()
            .map(r -> r.billing().balance())
            .filter(b -> b != null && b.signum() < 0)
            .map(BigDecimal::negate)
            .toList();
        BigDecimal total = debts.stream().reduce(BigDecimal.ZERO, BigDecimal::add);
        BigDecimal avg = debts.isEmpty()
            ? BigDecimal.ZERO
            : total.divide(BigDecimal.valueOf(debts.size()), 2, RoundingMode.HALF_UP);
        return new BillingReportsResponse.Debt(total, debts.size(), avg);
    }

    private static List<BillingReportsResponse.MethodShare> methods(
        List<BillingLedgerEntry> payments,
        Predicate<BillingLedgerEntry> filter
    ) {
        Map<BillingPaymentMethod, BigDecimal> amounts = new EnumMap<>(BillingPaymentMethod.class);
        Map<BillingPaymentMethod, Long> counts = new EnumMap<>(BillingPaymentMethod.class);
        payments.stream().filter(filter).forEach(e -> {
            BillingPaymentMethod m = e.getPaymentMethod() != null ? e.getPaymentMethod() : BillingPaymentMethod.OTHER;
            amounts.merge(m, e.getAmount(), BigDecimal::add);
            counts.merge(m, 1L, Long::sum);
        });
        BigDecimal total = amounts.values().stream().reduce(BigDecimal.ZERO, BigDecimal::add);
        List<BillingReportsResponse.MethodShare> out = new ArrayList<>();
        for (BillingPaymentMethod m : BillingPaymentMethod.values()) {
            BigDecimal amount = amounts.getOrDefault(m, BigDecimal.ZERO);
            int percent = total.signum() > 0
                ? amount.multiply(BigDecimal.valueOf(100)).divide(total, 0, RoundingMode.HALF_UP).intValue()
                : 0;
            out.add(new BillingReportsResponse.MethodShare(m, amount, counts.getOrDefault(m, 0L), percent));
        }
        return out;
    }
}
