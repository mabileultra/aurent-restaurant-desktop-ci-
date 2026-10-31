package com.pos.shared.api;

import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertEquals;

class PageLimitsTest {

    @Test
    void normalizesPageAndSize() {
        assertEquals(0, PageLimits.normalizePage(-2));
        assertEquals(PageLimits.DEFAULT_SIZE, PageLimits.normalizeSize(0));
        assertEquals(PageLimits.MAX_SIZE, PageLimits.normalizeSize(500));
        assertEquals(PageLimits.MAX_SIZE_REPORT, PageLimits.normalizeReportSize(500));
        assertEquals(25, PageLimits.normalizeSize(25));
    }
}
