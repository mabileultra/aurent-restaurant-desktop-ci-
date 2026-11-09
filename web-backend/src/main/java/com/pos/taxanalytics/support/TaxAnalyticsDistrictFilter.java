package com.pos.taxanalytics.support;

/** Sentinel for companies with region set but district_code NULL. */
public final class TaxAnalyticsDistrictFilter {

    public static final String UNASSIGNED_CODE = "UNASSIGNED";
    public static final String UNASSIGNED_NAME_RU = "Район не указан";
    public static final String UNASSIGNED_NAME_UZ = "Tumani belgilanmagan";

    private TaxAnalyticsDistrictFilter() {
    }

    public static boolean isUnassigned(String code) {
        return UNASSIGNED_CODE.equalsIgnoreCase(code);
    }
}
