package com.pos.taxanalytics.support;

import org.springframework.web.util.UriBuilder;
import org.springframework.web.util.UriComponentsBuilder;

import java.net.URI;

/**
 * Vertical tax-analytics paths under RestClient baseUrl {@code .../api/v1}.
 * Use {@link UriBuilder#pathSegment} — {@code path("internal/...")} without a trailing
 * slash on the base becomes {@code /api/v1internal/...} and 404s on the vertical service.
 */
public final class TaxAnalyticsVerticalUri {

    public static final String RST = "rst";
    public static final String PHARMACY = "pharmacy";

    private TaxAnalyticsVerticalUri() {
    }

    public static String ensureTrailingSlash(String baseUrl) {
        if (baseUrl == null || baseUrl.isBlank()) {
            return baseUrl;
        }
        return baseUrl.endsWith("/") ? baseUrl : baseUrl + "/";
    }

    /** Demonstrates / documents the broken vs fixed join (used in unit tests). */
    public static String brokenPathJoin(String baseUrl, String relativePath) {
        return UriComponentsBuilder.fromUriString(baseUrl).path(relativePath).build().toUriString();
    }

    public static String pathSegmentJoin(String baseUrl, String... segments) {
        return UriComponentsBuilder.fromUriString(baseUrl).pathSegment(segments).build().toUriString();
    }

    public static URI receiptDetail(UriBuilder uri, String verticalRoot, int companyId, String saleId) {
        return uri.pathSegment(
            "internal", verticalRoot, "tax-analytics", "companies",
            String.valueOf(companyId), "receipts", saleId
        ).build();
    }
}
