package com.pos.taxanalytics.support;

import com.pos.taxanalytics.dto.TaxAnalyticsCompanyRowResponse;
import com.pos.taxanalytics.dto.TaxAnalyticsCompanySummaryResponse;

import java.math.BigDecimal;
import java.util.Comparator;
import java.util.List;

public final class TaxAnalyticsCompanyListPage {

    private TaxAnalyticsCompanyListPage() {
    }

    public static List<TaxAnalyticsCompanyRowResponse> sort(List<TaxAnalyticsCompanyRowResponse> rows, String sort) {
        String raw = sort == null || sort.isBlank() ? "totalTurnover,desc" : sort.trim();
        String[] parts = raw.split(",", 2);
        String key = parts[0].trim().toLowerCase();
        boolean desc = parts.length < 2 || !"asc".equalsIgnoreCase(parts[1].trim());
        Comparator<TaxAnalyticsCompanyRowResponse> comparator = switch (key) {
            case "name" -> Comparator.comparing(row -> row.name() == null ? "" : row.name().toLowerCase());
            case "fiscalturnover" -> Comparator.comparing(TaxAnalyticsCompanyRowResponse::fiscalTurnover);
            case "nonfiscalturnover" -> Comparator.comparing(TaxAnalyticsCompanyRowResponse::nonFiscalTurnover);
            default -> Comparator.comparing(TaxAnalyticsCompanyRowResponse::totalTurnover);
        };
        if ("name".equals(key)) {
            desc = parts.length == 2 && "desc".equalsIgnoreCase(parts[1].trim());
        }
        if (desc) {
            comparator = comparator.reversed();
        }
        return rows.stream().sorted(comparator.thenComparing(TaxAnalyticsCompanyRowResponse::companyId)).toList();
    }

    public static TaxAnalyticsCompanySummaryResponse summary(List<TaxAnalyticsCompanyRowResponse> rows) {
        long withSales = rows.stream().filter(row -> row.totalTurnover().signum() > 0).count();
        BigDecimal fiscal = rows.stream().map(TaxAnalyticsCompanyRowResponse::fiscalTurnover).reduce(BigDecimal.ZERO, BigDecimal::add);
        BigDecimal nonFiscal = rows.stream().map(TaxAnalyticsCompanyRowResponse::nonFiscalTurnover).reduce(BigDecimal.ZERO, BigDecimal::add);
        BigDecimal total = fiscal.add(nonFiscal);
        BigDecimal top5 = rows.stream()
            .map(TaxAnalyticsCompanyRowResponse::totalTurnover)
            .sorted(Comparator.reverseOrder())
            .limit(5)
            .reduce(BigDecimal.ZERO, BigDecimal::add);
        return new TaxAnalyticsCompanySummaryResponse(
            withSales,
            TaxAnalyticsMath.shareAmount(top5, total),
            TaxAnalyticsMath.shareAmount(fiscal, total),
            TaxAnalyticsMath.shareAmount(nonFiscal, total)
        );
    }
}
