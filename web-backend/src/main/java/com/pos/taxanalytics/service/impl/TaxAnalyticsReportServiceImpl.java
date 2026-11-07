package com.pos.taxanalytics.service.impl;

import com.pos.taxanalytics.dto.TaxAnalyticsCompareResponse;
import com.pos.taxanalytics.dto.TaxAnalyticsDailyResponse;
import com.pos.taxanalytics.dto.TaxAnalyticsDayPointResponse;
import com.pos.taxanalytics.dto.TaxAnalyticsReceiptListResponse;
import com.pos.taxanalytics.dto.TaxAnalyticsReceiptRowResponse;
import com.pos.taxanalytics.dto.TaxAnalyticsResultRowResponse;
import com.pos.taxanalytics.repository.TaxAnalyticsReportQueryRepository;
import com.pos.taxanalytics.service.TaxAnalyticsCompanyService;
import com.pos.taxanalytics.service.TaxAnalyticsReportService;
import com.pos.taxanalytics.service.TaxAnalyticsService;
import com.pos.taxanalytics.support.TaxAnalyticsKpiBuilder;
import com.pos.taxanalytics.support.TaxAnalyticsPeriod;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class TaxAnalyticsReportServiceImpl implements TaxAnalyticsReportService {

    private static final int MAX_PAGE_SIZE = 100;

    private final TaxAnalyticsReportQueryRepository repository;
    private final TaxAnalyticsKpiBuilder kpiBuilder;
    private final TaxAnalyticsService taxAnalyticsService;
    private final TaxAnalyticsCompanyService companyService;

    @Override
    public TaxAnalyticsDailyResponse daily(String period, LocalDate from, LocalDate to) {
        TaxAnalyticsPeriod range = TaxAnalyticsPeriod.resolve(period, from, to);
        List<TaxAnalyticsDayPointResponse> days = new ArrayList<>();
        for (Map<String, Object> row : repository.daily(range)) {
            BigDecimal fiscal = decimal(row.get("fiscal_turnover"));
            BigDecimal nonFiscal = decimal(row.get("non_fiscal_turnover"));
            Integer leaderId = row.get("leader_company_id") instanceof Number number ? number.intValue() : null;
            days.add(new TaxAnalyticsDayPointResponse(
                String.valueOf(row.get("day")),
                fiscal,
                nonFiscal,
                fiscal.add(nonFiscal),
                leaderId,
                row.get("leader_company_name") == null ? null : String.valueOf(row.get("leader_company_name"))
            ));
        }
        return new TaxAnalyticsDailyResponse(range.from().toString(), range.to().toString(), days);
    }

    @Override
    public TaxAnalyticsReceiptListResponse receipts(
        String period,
        LocalDate from,
        LocalDate to,
        String regionCode,
        String connectionStatus,
        String search,
        int page,
        int size
    ) {
        TaxAnalyticsPeriod range = TaxAnalyticsPeriod.resolve(period, from, to);
        int safePage = Math.max(0, page);
        int safeSize = Math.min(Math.max(size, 1), MAX_PAGE_SIZE);
        long total = repository.countReceipts(range, regionCode, connectionStatus, search);
        List<TaxAnalyticsReceiptRowResponse> rows = new ArrayList<>();
        for (Map<String, Object> row : repository.receipts(range, regionCode, connectionStatus, search, safeSize, safePage * safeSize)) {
            rows.add(new TaxAnalyticsReceiptRowResponse(
                String.valueOf(row.get("sale_id")),
                row.get("receipt_number") == null ? null : String.valueOf(row.get("receipt_number")),
                row.get("created_at") == null ? null : String.valueOf(row.get("created_at")),
                row.get("store_name") == null ? null : String.valueOf(row.get("store_name")),
                decimal(row.get("total_amount")),
                row.get("fiscal_status") == null ? null : String.valueOf(row.get("fiscal_status")),
                Boolean.TRUE.equals(row.get("has_qr")),
                row.get("company_id") instanceof Number n ? n.intValue() : null,
                row.get("company_name") == null ? null : String.valueOf(row.get("company_name"))
            ));
        }
        return new TaxAnalyticsReceiptListResponse(
            range.from().toString(), range.to().toString(), total, safePage, safeSize, rows
        );
    }

    @Override
    public TaxAnalyticsCompareResponse compare(
        String period,
        LocalDate from,
        LocalDate to,
        String comparePeriod,
        LocalDate compareFrom,
        LocalDate compareTo
    ) {
        TaxAnalyticsPeriod current = TaxAnalyticsPeriod.resolve(period, from, to);
        TaxAnalyticsPeriod baseline = baseline(current, comparePeriod, compareFrom, compareTo);
        return new TaxAnalyticsCompareResponse(
            current.from().toString(),
            current.to().toString(),
            baseline.from().toString(),
            baseline.to().toString(),
            kpiBuilder.build(current),
            kpiBuilder.build(baseline),
            regions(period, from, to),
            regions("custom", baseline.from(), baseline.to()),
            companies(period, from, to),
            companies("custom", baseline.from(), baseline.to())
        );
    }

    private TaxAnalyticsPeriod baseline(
        TaxAnalyticsPeriod current,
        String comparePeriod,
        LocalDate compareFrom,
        LocalDate compareTo
    ) {
        if (compareFrom != null && compareTo != null) {
            return TaxAnalyticsPeriod.resolve("custom", compareFrom, compareTo);
        }
        if (comparePeriod == null || comparePeriod.isBlank() || "previous".equalsIgnoreCase(comparePeriod)) {
            return new TaxAnalyticsPeriod(
                current.prevFrom(), current.prevTo(), current.prevFrom(), current.prevTo(), "previous"
            );
        }
        return TaxAnalyticsPeriod.resolve(comparePeriod, null, null);
    }

    private List<TaxAnalyticsResultRowResponse> regions(String period, LocalDate from, LocalDate to) {
        return taxAnalyticsService.results(period, from, to, null, null, null, null, "REGION", 0, 100).rows();
    }

    private List<com.pos.taxanalytics.dto.TaxAnalyticsCompanyRowResponse> companies(
        String period,
        LocalDate from,
        LocalDate to
    ) {
        return companyService.list(
            period, from, to, null, null, null, null, 0, 10, "totalTurnover,desc"
        ).rows();
    }

    @Override
    public String exportCsv(String period, LocalDate from, LocalDate to) {
        var page = taxAnalyticsService.results(period, from, to, null, null, null, null, "REGION", 0, 100);
        StringBuilder csv = new StringBuilder();
        csv.append("code,name_uz,enterprises,fiscal_turnover,non_fiscal_turnover,total_turnover\n");
        for (TaxAnalyticsResultRowResponse row : page.rows()) {
            csv.append(csv(row.code())).append(',')
                .append(csv(row.nameUz())).append(',')
                .append(row.enterprises()).append(',')
                .append(row.fiscalTurnover()).append(',')
                .append(row.nonFiscalTurnover()).append(',')
                .append(row.totalTurnover()).append('\n');
        }
        return csv.toString();
    }

    private static BigDecimal decimal(Object value) {
        if (value == null) {
            return BigDecimal.ZERO;
        }
        return new BigDecimal(value.toString());
    }

    private static String csv(String value) {
        if (value == null) {
            return "";
        }
        String escaped = value.replace("\"", "\"\"");
        return "\"" + escaped + "\"";
    }
}
