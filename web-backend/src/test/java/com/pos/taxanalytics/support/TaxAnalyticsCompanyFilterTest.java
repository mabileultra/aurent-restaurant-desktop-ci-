package com.pos.taxanalytics.support;

import org.junit.jupiter.api.Test;

import java.util.ArrayList;
import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

class TaxAnalyticsCompanyFilterTest {

    @Test
    void appendAddsRegionDistrictAndBusinessType() {
        StringBuilder sql = new StringBuilder("WHERE 1=1");
        List<Object> args = new ArrayList<>();
        TaxAnalyticsCompanyFilter.append(sql, args, "17", "1701", "pharmacy", null, null);
        assertTrue(sql.toString().contains("c.region_code = ?"));
        assertTrue(sql.toString().contains("c.district_code = ?"));
        assertTrue(sql.toString().contains("UPPER(c.business_type) = ?"));
        assertEquals(List.of("17", "1701", "PHARMACY"), args);
    }

    @Test
    void anyDetectsGeoOrTypeFilters() {
        assertFalse(TaxAnalyticsCompanyFilter.any(null, null, null, null, null));
        assertTrue(TaxAnalyticsCompanyFilter.any("17", null, null, null, null));
        assertTrue(TaxAnalyticsCompanyFilter.any(null, "1701", null, null, null));
        assertTrue(TaxAnalyticsCompanyFilter.any(null, null, "GROCERY", null, null));
    }
}
