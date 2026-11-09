package com.pos.taxanalytics.support;

import java.util.List;

/** Shared company filters for tax-analytics SQL (region / district / type / connection / search). */
public final class TaxAnalyticsCompanyFilter {

    private TaxAnalyticsCompanyFilter() {
    }

    public static void append(
        StringBuilder sql,
        List<Object> args,
        String regionCode,
        String districtCode,
        String businessType,
        String connectionStatus,
        String search
    ) {
        TaxAnalyticsRegionFilter.append(sql, args, regionCode);
        if (districtCode != null && !districtCode.isBlank()) {
            sql.append(" AND c.district_code = ? ");
            args.add(districtCode.trim());
        }
        if (businessType != null && !businessType.isBlank()) {
            sql.append(" AND UPPER(c.business_type) = ? ");
            args.add(businessType.trim().toUpperCase());
        }
        if ("CONNECTED".equalsIgnoreCase(connectionStatus)) {
            sql.append(" AND conn.company_id IS NOT NULL ");
        } else if ("NOT_CONNECTED".equalsIgnoreCase(connectionStatus)) {
            sql.append(" AND conn.company_id IS NULL ");
        }
        if (search != null && !search.isBlank()) {
            sql.append(" AND (LOWER(c.name) LIKE ? OR LOWER(COALESCE(c.tin, '')) LIKE ? OR CAST(c.id AS TEXT) = ?) ");
            String query = "%" + search.trim().toLowerCase() + "%";
            args.add(query);
            args.add(query);
            args.add(search.trim());
        }
    }

    public static boolean any(
        String regionCode,
        String districtCode,
        String businessType,
        String connectionStatus,
        String search
    ) {
        return notBlank(regionCode)
            || notBlank(districtCode)
            || notBlank(businessType)
            || notBlank(connectionStatus)
            || notBlank(search);
    }

    private static boolean notBlank(String value) {
        return value != null && !value.isBlank();
    }
}
