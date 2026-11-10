package com.pos.taxanalytics.support;

import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

class TaxAnalyticsResultsBuilderTest {

    @Test
    void resolveLevelPrefersExplicitThenSearchDistrictRegion() {
        assertEquals("DISTRICT", TaxAnalyticsResultsBuilder.resolveLevel("district", "18", null, null));
        assertEquals("ENTERPRISE", TaxAnalyticsResultsBuilder.resolveLevel(null, "18", null, "makon"));
        assertEquals("ENTERPRISE", TaxAnalyticsResultsBuilder.resolveLevel(null, "18", "1801", null));
        assertEquals("DISTRICT", TaxAnalyticsResultsBuilder.resolveLevel(null, "18", null, null));
        assertEquals("REGION", TaxAnalyticsResultsBuilder.resolveLevel(null, null, null, null));
    }

    @Test
    void unassignedDistrictBucketConstants() {
        assertTrue(TaxAnalyticsDistrictFilter.isUnassigned("UNASSIGNED"));
        assertEquals("Tumani belgilanmagan", TaxAnalyticsDistrictFilter.UNASSIGNED_NAME_UZ);
    }
}
