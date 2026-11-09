package com.pos.taxanalytics.support;

import com.pos.taxanalytics.dto.TaxAnalyticsCompanyRowResponse;

import java.math.BigDecimal;
import java.util.Map;

public final class TaxAnalyticsCompanyRowMapper {

    private TaxAnalyticsCompanyRowMapper() {
    }

    public static TaxAnalyticsCompanyRowResponse toRow(Map<String, Object> row) {
        BigDecimal fiscal = TaxAnalyticsWeekMath.decimal(row.get("fiscal_turnover"));
        BigDecimal nonFiscal = TaxAnalyticsWeekMath.decimal(row.get("non_fiscal_turnover"));
        BigDecimal week = TaxAnalyticsWeekMath.decimal(row.get("week_turnover"));
        BigDecimal prevWeek = TaxAnalyticsWeekMath.decimal(row.get("prev_week_turnover"));
        BigDecimal currentDelta = fiscal.add(nonFiscal);
        BigDecimal previousDelta = row.get("prev_period_turnover") == null
            ? prevWeek
            : TaxAnalyticsWeekMath.decimal(row.get("prev_period_turnover"));
        if (row.get("prev_period_turnover") == null) {
            currentDelta = week;
        }
        return new TaxAnalyticsCompanyRowResponse(
            ((Number) row.get("company_id")).intValue(),
            text(row.get("name")),
            blankToNull(row.get("tin")),
            blankToNull(row.get("business_type")),
            blankToNull(row.get("legal_name")),
            blankToNull(row.get("address")),
            blankToNull(row.get("phone")),
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
            TaxAnalyticsWeekMath.deltaAmount(currentDelta, previousDelta),
            TaxAnalyticsWeekMath.deltaPct(currentDelta, previousDelta)
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
}
