package com.pos.taxanalytics.support;

import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

class TaxAnalyticsVerticalUriTest {

    @Test
    void pathWithoutSlashJoinsIntoBrokenApiV1internal() {
        String broken = TaxAnalyticsVerticalUri.brokenPathJoin(
            "http://restaurant-service:8087/api/v1",
            "internal/rst/tax-analytics/snapshot"
        );
        assertTrue(broken.contains("/api/v1internal/"), broken);
    }

    @Test
    void pathSegmentKeepsApiV1Prefix() {
        String ok = TaxAnalyticsVerticalUri.pathSegmentJoin(
            "http://restaurant-service:8087/api/v1",
            "internal", "rst", "tax-analytics", "snapshot"
        );
        assertEquals(
            "http://restaurant-service:8087/api/v1/internal/rst/tax-analytics/snapshot",
            ok
        );
        assertFalse(ok.contains("/api/v1internal/"));
    }

    @Test
    void trailingSlashHelper() {
        assertEquals("http://x/api/v1/", TaxAnalyticsVerticalUri.ensureTrailingSlash("http://x/api/v1"));
        assertEquals("http://x/api/v1/", TaxAnalyticsVerticalUri.ensureTrailingSlash("http://x/api/v1/"));
    }
}
