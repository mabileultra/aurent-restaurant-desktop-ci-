package com.pos.restaurant.analytics.support;

import com.pos.restaurant.analytics.dto.ActivityEventResponse;
import com.pos.shared.api.FilterText;
import com.pos.shared.api.PageLimits;
import com.pos.shared.api.PageResponse;
import org.junit.jupiter.api.Test;

import java.time.Instant;
import java.util.List;
import java.util.Locale;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

/**
 * Mirrors activity paging/filter assembly used by RestaurantAnalyticsServiceImpl.
 */
class ActivityPageSliceTest {

    @Test
    void pagesFilteredEventsAsPageResponse() {
        Instant t0 = Instant.parse("2026-10-01T10:00:00Z");
        Instant t1 = Instant.parse("2026-10-01T11:00:00Z");
        Instant t2 = Instant.parse("2026-10-01T12:00:00Z");
        List<ActivityEventResponse> all = List.of(
            event(t2, "PAYMENT", "CASH|10|1"),
            event(t1, "ORDER_OPEN", "2"),
            event(t0, "PAYMENT", "CARD|20|3")
        );

        String typeFilter = "PAYMENT";
        String q = FilterText.normalizeSearch("card");
        List<ActivityEventResponse> filtered = all.stream()
            .filter(e -> typeFilter.equals(e.type()))
            .filter(e -> e.summary().toLowerCase(Locale.ROOT).contains(q))
            .toList();

        int page = PageLimits.normalizePage(0);
        int size = PageLimits.normalizeSize(20);
        PageResponse<ActivityEventResponse> response = PageResponse.of(
            filtered.subList(0, Math.min(size, filtered.size())),
            page,
            size,
            filtered.size()
        );

        assertEquals(1, response.totalElements());
        assertEquals(1, response.content().size());
        assertEquals("CARD|20|3", response.content().get(0).summary());
        assertEquals(0, response.number());
        assertTrue(response.size() <= PageLimits.MAX_SIZE);
    }

    private static ActivityEventResponse event(Instant at, String type, String summary) {
        return new ActivityEventResponse(at, type, summary, UUID.randomUUID(), "order", "1");
    }
}
