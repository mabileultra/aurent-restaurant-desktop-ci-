package com.pos.taxanalytics.service.impl;

import com.pos.exception.PosExceptions;
import com.pos.taxanalytics.client.TaxAnalyticsPharmacyClient;
import com.pos.taxanalytics.client.TaxAnalyticsRestaurantClient;
import com.pos.taxanalytics.client.dto.TaxAnalyticsCompanyMoneyDto;
import com.pos.taxanalytics.dto.TaxAnalyticsCompaniesResponse;
import com.pos.taxanalytics.dto.TaxAnalyticsCompanyDetailResponse;
import com.pos.taxanalytics.dto.TaxAnalyticsCompanyProductResponse;
import com.pos.taxanalytics.dto.TaxAnalyticsCompanyRowResponse;
import com.pos.taxanalytics.dto.TaxAnalyticsCompanySupplyResponse;
import com.pos.taxanalytics.dto.TaxAnalyticsCompanySupplyRowResponse;
import com.pos.taxanalytics.repository.TaxAnalyticsCompanyQueryRepository;
import com.pos.taxanalytics.repository.TaxAnalyticsCompanyStatsRepository;
import com.pos.taxanalytics.service.TaxAnalyticsCompanyService;
import com.pos.taxanalytics.support.TaxAnalyticsCompanyDays;
import com.pos.taxanalytics.support.TaxAnalyticsCompanyListPage;
import com.pos.taxanalytics.support.TaxAnalyticsCompanyProductsLoader;
import com.pos.taxanalytics.support.TaxAnalyticsCompanyRowMapper;
import com.pos.taxanalytics.support.TaxAnalyticsCompanyWeeks;
import com.pos.taxanalytics.support.TaxAnalyticsCompanyWeeks.DayTurnover;
import com.pos.taxanalytics.support.TaxAnalyticsPeriod;
import com.pos.taxanalytics.support.TaxAnalyticsVerticalMerge;
import com.pos.taxanalytics.support.TaxAnalyticsVerticalReceiptBridge;
import com.pos.taxanalytics.support.TaxAnalyticsVerticalSnapshotLoader;
import com.pos.taxanalytics.support.TaxAnalyticsWeekMath;
import com.pos.taxanalytics.support.TaxAnalyticsWeekWindow;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.sql.Date;
import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.temporal.TemporalAdjusters;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class TaxAnalyticsCompanyServiceImpl implements TaxAnalyticsCompanyService {

    private final TaxAnalyticsCompanyQueryRepository repository;
    private final TaxAnalyticsCompanyStatsRepository statsRepository;
    private final TaxAnalyticsVerticalSnapshotLoader verticalLoader;
    private final TaxAnalyticsVerticalReceiptBridge verticalReceipts;
    private final TaxAnalyticsCompanyProductsLoader productsLoader;
    private final TaxAnalyticsRestaurantClient restaurantClient;
    private final TaxAnalyticsPharmacyClient pharmacyClient;

    @Override
    public TaxAnalyticsCompaniesResponse list(
        String period,
        LocalDate from,
        LocalDate to,
        String regionCode,
        String districtCode,
        String businessType,
        String connectionStatus,
        String search,
        int page,
        int size,
        String sort
    ) {
        TaxAnalyticsPeriod range = TaxAnalyticsPeriod.resolve(period, from, to);
        TaxAnalyticsWeekWindow week = TaxAnalyticsWeekWindow.current();
        int safePage = Math.min(Math.max(page, 0), 10_000);
        int safeSize = Math.min(Math.max(size, 1), 100);
        boolean filterConnected = connectionStatus != null && !connectionStatus.isBlank();
        TaxAnalyticsVerticalSnapshotLoader.Pair vertical = verticalLoader.load(
            range.from(), range.to(), week.weekFrom(), week.weekTo(), week.prevWeekFrom(), week.prevWeekTo()
        );
        Map<Integer, TaxAnalyticsCompanyMoneyDto> restaurant = TaxAnalyticsVerticalMerge.index(vertical.restaurant());
        Map<Integer, TaxAnalyticsCompanyMoneyDto> pharmacy = TaxAnalyticsVerticalMerge.index(vertical.pharmacy());
        Set<Integer> connected = TaxAnalyticsVerticalMerge.connectedIds(vertical.restaurant(), vertical.pharmacy());

        List<TaxAnalyticsCompanyRowResponse> all = repository.listCompanies(
            range, week, regionCode, districtCode, businessType, filterConnected ? null : connectionStatus, search, 10_000, 0
        ).stream().map(row -> {
            TaxAnalyticsCompanyRowResponse base = TaxAnalyticsCompanyRowMapper.toRow(row);
            int companyId = base.companyId();
            TaxAnalyticsCompanyMoneyDto mergedExtra = sumExtras(restaurant.get(companyId), pharmacy.get(companyId));
            return TaxAnalyticsVerticalMerge.mergeRow(base, mergedExtra, connected.contains(companyId));
        }).filter(row -> matchesConnection(row.connected(), connectionStatus)).toList();
        List<TaxAnalyticsCompanyRowResponse> sorted = TaxAnalyticsCompanyListPage.sort(all, sort);
        int fromIdx = Math.min(safePage * safeSize, sorted.size());
        int toIdx = Math.min(fromIdx + safeSize, sorted.size());
        return new TaxAnalyticsCompaniesResponse(
            range.key(),
            range.from().toString(),
            range.to().toString(),
            week.weekFrom().toString(),
            week.weekTo().toString(),
            week.prevWeekFrom().toString(),
            week.prevWeekTo().toString(),
            sorted.size(),
            safePage,
            safeSize,
            sorted.subList(fromIdx, toIdx),
            TaxAnalyticsCompanyListPage.summary(sorted)
        );
    }

    @Override
    public TaxAnalyticsCompanyDetailResponse detail(int companyId, String period, LocalDate from, LocalDate to) {
        Map<String, Object> company = repository.findCompany(companyId);
        if (company == null) {
            throw PosExceptions.notFound("Company", companyId);
        }
        TaxAnalyticsPeriod range = TaxAnalyticsPeriod.resolve(period, from, to);
        TaxAnalyticsWeekWindow week = TaxAnalyticsWeekWindow.current();
        Map<String, Object> turnover = repository.periodTurnover(companyId, range);
        Map<String, Object> receiptStats = statsRepository.periodReceiptStats(companyId, range);
        Map<String, Object> bounds = statsRepository.saleBounds(companyId);
        String fiscalTerminalId = statsRepository.latestFiscalTerminal(companyId);
        LocalDate today = LocalDate.now(TaxAnalyticsWeekWindow.ZONE);
        LocalDate thisMonday = today.with(TemporalAdjusters.previousOrSame(DayOfWeek.MONDAY));
        LocalDate seriesFrom = thisMonday.minusWeeks(TaxAnalyticsCompanyWeeks.DISPLAYED);
        LocalDate dayFrom = range.from();
        LocalDate dayTo = range.to().isAfter(today) ? today : range.to();
        LocalDate seriesStart = seriesFrom.isBefore(dayFrom) ? seriesFrom : dayFrom;
        Map<LocalDate, DayTurnover> byDate = new HashMap<>();
        for (Map<String, Object> day : repository.dailyTurnover(companyId, seriesStart, today.plusDays(1))) {
            byDate.put(toDate(day.get("sale_date")), new DayTurnover(
                TaxAnalyticsWeekMath.decimal(day.get("fiscal_turnover")),
                TaxAnalyticsWeekMath.decimal(day.get("non_fiscal_turnover")),
                asLong(day.get("receipt_count"))
            ));
        }
        TaxAnalyticsVerticalMerge.mergeDays(byDate, restaurantClient.daily(companyId, seriesStart, today));
        TaxAnalyticsVerticalMerge.mergeDays(byDate, pharmacyClient.daily(companyId, seriesStart, today));

        TaxAnalyticsVerticalSnapshotLoader.Pair vertical = verticalLoader.load(
            range.from(), range.to(), week.weekFrom(), week.weekTo(), week.prevWeekFrom(), week.prevWeekTo()
        );
        TaxAnalyticsCompanyMoneyDto extra = sumExtras(
            TaxAnalyticsVerticalMerge.index(vertical.restaurant()).get(companyId),
            TaxAnalyticsVerticalMerge.index(vertical.pharmacy()).get(companyId)
        );
        boolean connected = connected(company.get("connected"))
            || TaxAnalyticsVerticalMerge.connectedIds(vertical.restaurant(), vertical.pharmacy()).contains(companyId);

        BigDecimal fiscal = TaxAnalyticsWeekMath.decimal(turnover.get("fiscal_turnover"))
            .add(extra == null ? BigDecimal.ZERO : nz(extra.fiscalTurnover()));
        BigDecimal nonFiscal = TaxAnalyticsWeekMath.decimal(turnover.get("non_fiscal_turnover"))
            .add(extra == null ? BigDecimal.ZERO : nz(extra.nonFiscalTurnover()));
        long fiscalReceipts = asLong(receiptStats.get("fiscal_receipt_count"));
        long nonFiscalReceipts = asLong(receiptStats.get("non_fiscal_receipt_count"));
        if (fiscalReceipts + nonFiscalReceipts == 0) {
            TaxAnalyticsVerticalReceiptBridge.Counts verticalCounts = verticalReceipts.receiptCounts(
                companyId, range.from(), range.to()
            );
            fiscalReceipts = verticalCounts.fiscal();
            nonFiscalReceipts = verticalCounts.nonFiscal();
        }
        BigDecimal averageCheck = averageCheck(fiscal.add(nonFiscal), fiscalReceipts + nonFiscalReceipts);
        return new TaxAnalyticsCompanyDetailResponse(
            companyId,
            text(company.get("name")),
            blankToNull(company.get("tin")),
            blankToNull(company.get("business_type")),
            blankToNull(company.get("legal_name")),
            blankToNull(company.get("address")),
            blankToNull(company.get("phone")),
            blankToNull(company.get("region_code")),
            blankToNull(company.get("region_name_ru")),
            blankToNull(company.get("region_name_uz")),
            blankToNull(company.get("district_code")),
            blankToNull(company.get("district_name_ru")),
            blankToNull(company.get("district_name_uz")),
            connected,
            range.key(),
            range.from().toString(),
            range.to().toString(),
            fiscal,
            nonFiscal,
            fiscal.add(nonFiscal),
            fiscalReceipts,
            nonFiscalReceipts,
            averageCheck,
            fiscalTerminalId,
            dateText(bounds.get("first_sale_date")),
            dateText(bounds.get("last_sale_date")),
            TaxAnalyticsCompanyWeeks.build(today, byDate),
            TaxAnalyticsCompanyDays.build(dayFrom, dayTo, byDate),
            productsLoader.load(companyId, range),
            supplies(companyId, range)
        );
    }

    private TaxAnalyticsCompanySupplyResponse supplies(int companyId, TaxAnalyticsPeriod range) {
        Map<String, Object> summary = repository.supplySummary(companyId, range);
        List<TaxAnalyticsCompanySupplyRowResponse> rows = new ArrayList<>();
        for (Map<String, Object> row : repository.supplyRows(companyId, range, 200)) {
            Object date = row.get("document_date");
            rows.add(new TaxAnalyticsCompanySupplyRowResponse(
                text(row.get("receipt_number")),
                date == null ? null : toDate(date).toString(),
                blankToNull(row.get("supplier_name")),
                TaxAnalyticsWeekMath.decimal(row.get("total_quantity")),
                TaxAnalyticsWeekMath.decimal(row.get("total_cost"))
            ));
        }
        long count = summary.get("receipt_count") instanceof Number number ? number.longValue() : 0L;
        return new TaxAnalyticsCompanySupplyResponse(
            count,
            TaxAnalyticsWeekMath.decimal(summary.get("total_quantity")),
            TaxAnalyticsWeekMath.decimal(summary.get("total_cost")),
            TaxAnalyticsWeekMath.decimal(summary.get("total_retail")),
            rows
        );
    }

    private static boolean matchesConnection(boolean connected, String connectionStatus) {
        if (connectionStatus == null || connectionStatus.isBlank()) {
            return true;
        }
        if ("CONNECTED".equalsIgnoreCase(connectionStatus)) {
            return connected;
        }
        if ("NOT_CONNECTED".equalsIgnoreCase(connectionStatus)) {
            return !connected;
        }
        return true;
    }

    private static TaxAnalyticsCompanyMoneyDto sumExtras(
        TaxAnalyticsCompanyMoneyDto restaurant,
        TaxAnalyticsCompanyMoneyDto pharmacy
    ) {
        if (restaurant == null) {
            return pharmacy;
        }
        if (pharmacy == null) {
            return restaurant;
        }
        return new TaxAnalyticsCompanyMoneyDto(
            restaurant.companyId(),
            nz(restaurant.fiscalTurnover()).add(nz(pharmacy.fiscalTurnover())),
            nz(restaurant.nonFiscalTurnover()).add(nz(pharmacy.nonFiscalTurnover())),
            nz(restaurant.weekTurnover()).add(nz(pharmacy.weekTurnover())),
            nz(restaurant.prevWeekTurnover()).add(nz(pharmacy.prevWeekTurnover()))
        );
    }

    private static BigDecimal averageCheck(BigDecimal total, long receipts) {
        if (receipts <= 0) {
            return BigDecimal.ZERO;
        }
        return total.divide(BigDecimal.valueOf(receipts), 2, RoundingMode.HALF_UP);
    }

    private static boolean connected(Object value) {
        return value instanceof Number number && number.intValue() == 1;
    }

    private static long asLong(Object value) {
        return value instanceof Number number ? number.longValue() : 0L;
    }

    private static BigDecimal nz(BigDecimal value) {
        return value == null ? BigDecimal.ZERO : value;
    }

    private static String text(Object value) {
        return value == null ? "" : String.valueOf(value);
    }

    private static String blankToNull(Object value) {
        if (value == null) {
            return null;
        }
        String text = String.valueOf(value).trim();
        return text.isEmpty() ? null : text;
    }

    private static String dateText(Object value) {
        if (value == null) {
            return null;
        }
        return toDate(value).toString();
    }

    private static LocalDate toDate(Object value) {
        if (value instanceof LocalDate date) {
            return date;
        }
        if (value instanceof Date date) {
            return date.toLocalDate();
        }
        return LocalDate.parse(String.valueOf(value).substring(0, 10));
    }
}
