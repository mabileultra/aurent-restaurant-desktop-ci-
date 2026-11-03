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
import com.pos.taxanalytics.service.TaxAnalyticsCompanyService;
import com.pos.taxanalytics.support.TaxAnalyticsCompanyDays;
import com.pos.taxanalytics.support.TaxAnalyticsCompanyWeeks;
import com.pos.taxanalytics.support.TaxAnalyticsCompanyWeeks.DayTurnover;
import com.pos.taxanalytics.support.TaxAnalyticsPeriod;
import com.pos.taxanalytics.support.TaxAnalyticsVerticalMerge;
import com.pos.taxanalytics.support.TaxAnalyticsVerticalSnapshotLoader;
import com.pos.taxanalytics.support.TaxAnalyticsWeekMath;
import com.pos.taxanalytics.support.TaxAnalyticsWeekWindow;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
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
    private final TaxAnalyticsVerticalSnapshotLoader verticalLoader;
    private final TaxAnalyticsRestaurantClient restaurantClient;
    private final TaxAnalyticsPharmacyClient pharmacyClient;

    @Override
    public TaxAnalyticsCompaniesResponse list(
        String period,
        LocalDate from,
        LocalDate to,
        String regionCode,
        String districtCode,
        String connectionStatus,
        String search,
        int page,
        int size
    ) {
        TaxAnalyticsPeriod range = TaxAnalyticsPeriod.resolve(period, from, to);
        TaxAnalyticsWeekWindow week = TaxAnalyticsWeekWindow.current();
        int safePage = Math.min(Math.max(page, 0), 10_000);
        int safeSize = Math.min(Math.max(size, 1), 100);
        // Connection filter applied after restaurant/pharmacy merge (grocery SQL alone misses edge Multikassa).
        boolean filterConnected = connectionStatus != null && !connectionStatus.isBlank();
        TaxAnalyticsVerticalSnapshotLoader.Pair vertical = verticalLoader.load(
            range.from(), range.to(), week.weekFrom(), week.weekTo(), week.prevWeekFrom(), week.prevWeekTo()
        );
        Map<Integer, TaxAnalyticsCompanyMoneyDto> restaurant = TaxAnalyticsVerticalMerge.index(vertical.restaurant());
        Map<Integer, TaxAnalyticsCompanyMoneyDto> pharmacy = TaxAnalyticsVerticalMerge.index(vertical.pharmacy());
        Set<Integer> connected = TaxAnalyticsVerticalMerge.connectedIds(vertical.restaurant(), vertical.pharmacy());

        List<TaxAnalyticsCompanyRowResponse> all = repository.listCompanies(
            range, week, regionCode, districtCode, filterConnected ? null : connectionStatus, search, 10_000, 0
        ).stream().map(row -> {
            TaxAnalyticsCompanyRowResponse base = toRow(row);
            int companyId = base.companyId();
            TaxAnalyticsCompanyMoneyDto mergedExtra = sumExtras(restaurant.get(companyId), pharmacy.get(companyId));
            return TaxAnalyticsVerticalMerge.mergeRow(base, mergedExtra, connected.contains(companyId));
        }).filter(row -> matchesConnection(row.connected(), connectionStatus)).toList();
        long total = all.size();
        int fromIdx = Math.min(safePage * safeSize, all.size());
        int toIdx = Math.min(fromIdx + safeSize, all.size());
        List<TaxAnalyticsCompanyRowResponse> rows = all.subList(fromIdx, toIdx);
        return new TaxAnalyticsCompaniesResponse(
            range.key(),
            range.from().toString(),
            range.to().toString(),
            week.weekFrom().toString(),
            week.weekTo().toString(),
            week.prevWeekFrom().toString(),
            week.prevWeekTo().toString(),
            total,
            safePage,
            safeSize,
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

    @Override
    public TaxAnalyticsCompanyDetailResponse detail(int companyId, String period, LocalDate from, LocalDate to) {
        Map<String, Object> company = repository.findCompany(companyId);
        if (company == null) {
            throw PosExceptions.notFound("Company", companyId);
        }
        TaxAnalyticsPeriod range = TaxAnalyticsPeriod.resolve(period, from, to);
        TaxAnalyticsWeekWindow week = TaxAnalyticsWeekWindow.current();
        Map<String, Object> turnover = repository.periodTurnover(companyId, range);
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
                TaxAnalyticsWeekMath.decimal(day.get("non_fiscal_turnover"))
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
        return new TaxAnalyticsCompanyDetailResponse(
            companyId,
            text(company.get("name")),
            blankToNull(company.get("tin")),
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
            TaxAnalyticsCompanyWeeks.build(today, byDate),
            TaxAnalyticsCompanyDays.build(dayFrom, dayTo, byDate),
            topProducts(companyId, range),
            supplies(companyId, range)
        );
    }

    private List<TaxAnalyticsCompanyProductResponse> topProducts(int companyId, TaxAnalyticsPeriod range) {
        List<TaxAnalyticsCompanyProductResponse> products = new ArrayList<>();
        for (Map<String, Object> row : repository.topProducts(companyId, range, 200)) {
            products.add(new TaxAnalyticsCompanyProductResponse(
                text(row.get("product_name")),
                TaxAnalyticsWeekMath.decimal(row.get("quantity")),
                TaxAnalyticsWeekMath.decimal(row.get("amount"))
            ));
        }
        return products;
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

    private static TaxAnalyticsCompanyRowResponse toRow(Map<String, Object> row) {
        BigDecimal fiscal = TaxAnalyticsWeekMath.decimal(row.get("fiscal_turnover"));
        BigDecimal nonFiscal = TaxAnalyticsWeekMath.decimal(row.get("non_fiscal_turnover"));
        BigDecimal week = TaxAnalyticsWeekMath.decimal(row.get("week_turnover"));
        BigDecimal prevWeek = TaxAnalyticsWeekMath.decimal(row.get("prev_week_turnover"));
        return new TaxAnalyticsCompanyRowResponse(
            ((Number) row.get("company_id")).intValue(),
            text(row.get("name")),
            blankToNull(row.get("tin")),
            blankToNull(row.get("region_code")),
            blankToNull(row.get("region_name_ru")),
            blankToNull(row.get("region_name_uz")),
            blankToNull(row.get("district_code")),
            blankToNull(row.get("district_name_ru")),
            blankToNull(row.get("district_name_uz")),
            connected(row.get("connected")),
            row.get("store_count") instanceof Number stores ? stores.intValue() : 0,
            blankToNull(row.get("store_names")),
            fiscal,
            nonFiscal,
            fiscal.add(nonFiscal),
            week,
            prevWeek,
            TaxAnalyticsWeekMath.deltaAmount(week, prevWeek),
            TaxAnalyticsWeekMath.deltaPct(week, prevWeek)
        );
    }

    private static boolean connected(Object value) {
        return value instanceof Number number && number.intValue() == 1;
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
