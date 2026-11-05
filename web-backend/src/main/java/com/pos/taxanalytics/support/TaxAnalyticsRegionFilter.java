package com.pos.taxanalytics.support;

import java.util.List;

/** Region code {@code 0} is the backend row for companies with no region. */
public final class TaxAnalyticsRegionFilter {

    public static final String MISSING_CODE = "0";
    public static final String MISSING_NAME_RU = "Регион не указан";
    public static final String MISSING_NAME_UZ = "Hududi ko'rsatilmagan";

    private TaxAnalyticsRegionFilter() {
    }

    public static boolean isMissing(String regionCode) {
        return MISSING_CODE.equals(regionCode);
    }

    public static void append(StringBuilder sql, List<Object> args, String regionCode) {
        if (regionCode == null || regionCode.isBlank()) {
            return;
        }
        if (isMissing(regionCode)) {
            sql.append(" AND c.region_code IS NULL ");
            return;
        }
        sql.append(" AND c.region_code = ? ");
        args.add(regionCode);
    }
}
