package com.pos.taxanalytics.service.impl;

import com.pos.exception.PosExceptions;
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

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class TaxAnalyticsCompanyServiceImpl implements TaxAnalyticsCompanyService {

    private final TaxAnalyticsCompanyQueryRepository repository;

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
        long total = repository.countCompanies(regionCode, districtCode, connectionStatus, search);
        List<TaxAnalyticsCompanyRowResponse> rows = repository.listCompanies(
            range, week, regionCode, districtCode, connectionStatus, search, safeSize, safePage * safeSize
        ).stream().map(TaxAnalyticsCompanyServiceImpl::toRow).toList();
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

    @Override
    public TaxAnalyticsCompanyDetailResponse detail(int companyId, String period, LocalDate from, LocalDate to) {
        Map<String, Object> company = repository.findCompany(companyId);
        if (company == null) {
            throw PosExceptions.notFound("Company", companyId);
        }
        TaxAnalyticsPeriod range = TaxAnalyticsPeriod.resolve(period, from, to);
        Map<String, Object> turnover = repository.periodTurnover(companyId, range);
        LocalDate today = LocalDate.now(TaxAnalyticsWeekWindow.ZONE);
        LocalDate thisMonday = today.with(TemporalAdjusters.previousOrSame(DayOfWeek.MONDAY));
        LocalDate seriesFrom = thisMonday.minusWeeks(TaxAnalyticsCompanyWeeks.DISPLAYED);
        LocalDate dayFrom = range.from();
        LocalDate dayTo = range.to().isAfter(today) ? today : range.to();
        if (dayTo.toEpochDay() - dayFrom.toEpochDay() + 1 > TaxAnalyticsCompanyDays.MAX_DAYS) {
            dayFrom = dayTo.minusDays(TaxAnalyticsCompanyDays.MAX_DAYS - 1);
        }
        LocalDate seriesStart = seriesFrom.isBefore(dayFrom) ? seriesFrom : dayFrom;
        Map<LocalDate, DayTurnover> byDate = new HashMap<>();
        for (Map<String, Object> day : repository.dailyTurnover(companyId, seriesStart, today.plusDays(1))) {
            byDate.put(toDate(day.get("sale_date")), new DayTurnover(
                TaxAnalyticsWeekMath.decimal(day.get("fiscal_turnover")),
                TaxAnalyticsWeekMath.decimal(day.get("non_fiscal_turnover"))
            ));
        }
        BigDecimal fiscal = TaxAnalyticsWeekMath.decimal(turnover.get("fiscal_turnover"));
        BigDecimal nonFiscal = TaxAnalyticsWeekMath.decimal(turnover.get("non_fiscal_turnover"));
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
            connected(company.get("connected")),
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
        for (Map<String, Object> row : repository.topProducts(companyId, range, 8)) {
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
        for (Map<String, Object> row : repository.supplyRows(companyId, range, 8)) {
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
